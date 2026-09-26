const root = document.documentElement
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

// ——————————————————————————————————————————————————
// Boot sequence: first visit only, ~1.4s, skippable (Esc, click, any key).
// The inline script in <head> decides whether it runs (adds .booting).
// ——————————————————————————————————————————————————

const Boot = (() => {
  const LINES = [
    ['INITIALIZING SUHAIL.AHMED...', ''],
    ['LOADING DATA ENGINEERING MODULES...', ''],
    ['CONNECTING TO DATA PLANE...', ''],
    ['DATABRICKS ........ ', 'ONLINE'],
    ['PYSPARK ........... ', 'ONLINE'],
    ['SQL ............... ', 'ONLINE'],
    ['AWS ............... ', 'ONLINE'],
    ['DELTA LAKE ........ ', 'ONLINE'],
    ['SYSTEM STATUS: ', 'OPERATIONAL']
  ]

  const finish = (screen) => {
    try { localStorage.setItem('sa-boot', '1') } catch (e) {}
    screen.classList.add('done')
    root.classList.remove('booting')
    setTimeout(() => screen.remove(), 350)
  }

  const run = () => {
    const screen = document.getElementById('boot')
    if (!screen) return
    if (!root.classList.contains('booting')) { screen.remove(); return }

    const log = document.getElementById('boot-log')
    const fill = document.getElementById('boot-fill')
    const timers = []
    let ended = false

    const end = () => {
      if (ended) return
      ended = true
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', end)
      screen.removeEventListener('click', end)
      finish(screen)
    }

    const STEP = 115
    LINES.forEach(([text, status], i) => {
      timers.push(setTimeout(() => {
        const line = document.createElement('span')
        line.className = i === LINES.length - 1 ? 'hl' : ''
        line.textContent = text
        if (status) {
          const s = document.createElement('span')
          s.className = 'ok'
          s.textContent = status
          line.append(s)
        }
        log.append(line, '\n')
        fill.style.width = `${Math.round(((i + 1) / LINES.length) * 100)}%`
      }, i * STEP))
    })
    timers.push(setTimeout(end, LINES.length * STEP + 280))

    window.addEventListener('keydown', end)
    screen.addEventListener('click', end)
  }

  return { run }
})()

Boot.run()

// ——————————————————————————————————————————————————
// Scramble: text decodes from random glyphs into its final value
//
//   <span data-scramble>About / Profile</span>   decodes once when it enters the viewport
//
// The real text stays in the DOM for screen readers and layout: the visible
// glyphs are an aria-hidden overlay on top of an invisible copy, so the box
// never changes size while it animates.
// ——————————————————————————————————————————————————

const Scramble = (() => {
  const GLYPHS = '01X#@%/\\<>_+*?'
  const running = new WeakMap()
  const noise = (text) => [...text].map((ch) => (ch === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('')

  const prepare = (el) => {
    if (el.dataset.scrambleReady) return
    const text = el.textContent
    el.dataset.scrambleText = text
    el.classList.add('scr')
    el.textContent = ''
    const final = document.createElement('span')
    final.className = 'scr-final'
    final.textContent = text
    const layer = document.createElement('span')
    layer.className = 'scr-layer'
    layer.setAttribute('aria-hidden', 'true')
    el.append(final, layer)
    el.dataset.scrambleReady = '1'
  }

  const run = (el, duration = 650) => {
    prepare(el)
    if (running.get(el)) return
    const text = el.dataset.scrambleText
    const layer = el.querySelector('.scr-layer')
    // each character settles at its own moment, roughly left to right
    const settle = [...text].map((_, i) => (i / text.length) * duration * 0.7 + Math.random() * duration * 0.3)
    const start = performance.now()
    let lastSwap = 0
    running.set(el, true)
    el.classList.add('scr-on')

    const frame = (now) => {
      const t = now - start
      if (t >= duration) {
        el.classList.remove('scr-on')
        layer.textContent = ''
        running.set(el, false)
        return
      }
      if (now - lastSwap > 45) {
        lastSwap = now
        let out = ''
        for (let i = 0; i < text.length; i++) {
          const ch = text[i]
          out += ch === ' ' || t >= settle[i] ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
        layer.textContent = out
      }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  const init = () => {
    if (reduceMotion || !('IntersectionObserver' in window)) return
    const els = document.querySelectorAll('[data-scramble]')
    els.forEach((el) => {
      prepare(el)
      el.querySelector('.scr-layer').textContent = noise(el.dataset.scrambleText)
      el.classList.add('scr-on')
    })
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        io.unobserve(entry.target)
        run(entry.target, 700)
      })
    }, { threshold: 0.6 })
    els.forEach((el) => io.observe(el))
  }

  return { init }
})()

Scramble.init()

// ——————————————————————————————————————————————————
// Navigation: mobile menu, bar background on scroll, active section
// ——————————————————————————————————————————————————

const topbar = document.querySelector('.topbar')
const navToggle = document.getElementById('nav-toggle')
const navList = document.getElementById('nav-links')

const setMenu = (open) => {
  navList.classList.toggle('open', open)
  topbar.classList.toggle('menu-open', open)
  navToggle.setAttribute('aria-expanded', String(open))
}

navToggle.addEventListener('click', () => setMenu(!navList.classList.contains('open')))
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navList.classList.contains('open')) {
    setMenu(false)
    navToggle.focus()
  }
})
document.addEventListener('click', (e) => {
  if (navList.classList.contains('open') && !e.target.closest('.nav')) setMenu(false)
})
navList.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)))

const navLinks = [...navList.querySelectorAll('a[href^="#"]')].filter((a) => !a.closest('.nav-extra'))
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href')))

let scrollTick = false
const onScroll = () => {
  scrollTick = false
  topbar.classList.toggle('scrolled', window.scrollY > 8)

  const y = window.scrollY + window.innerHeight * 0.35
  let current = null
  sections.forEach((s) => { if (s && s.offsetTop <= y) current = s })
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = sections[sections.length - 1]
  navLinks.forEach((a) => {
    const on = current !== null && a.getAttribute('href') === `#${current.id}`
    a.classList.toggle('active', on)
    if (on) a.setAttribute('aria-current', 'true')
    else a.removeAttribute('aria-current')
  })
}

window.addEventListener('scroll', () => {
  if (!scrollTick) { scrollTick = true; requestAnimationFrame(onScroll) }
}, { passive: true })
onScroll()

// ——————————————————————————————————————————————————
// Reveal on scroll
// ——————————————————————————————————————————————————

const revealEls = document.querySelectorAll('.reveal')

if (!reduceMotion && 'IntersectionObserver' in window) {
  // content is only hidden once this observer is ready to reveal it again
  root.classList.add('reveal-on')
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in')
        io.unobserve(entry.target)
      }
    })
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
  revealEls.forEach((el) => io.observe(el))
}

// ——————————————————————————————————————————————————
// Experience timeline: expandable entries
// ——————————————————————————————————————————————————

document.querySelectorAll('.tl-head').forEach((btn) => {
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true'
    btn.setAttribute('aria-expanded', String(open))
    document.getElementById(btn.getAttribute('aria-controls')).hidden = !open
    btn.closest('.tl-item').classList.toggle('is-open', open)
  })
})

// ——————————————————————————————————————————————————
// Project case studies: native <dialog> with a short "system access" intro
// ——————————————————————————————————————————————————

document.querySelectorAll('.arch').forEach((ol) => {
  ol.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i))
})

let lastOpener = null

document.querySelectorAll('[data-open]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dlg = document.getElementById(btn.dataset.open)
    if (!dlg || typeof dlg.showModal !== 'function') return
    lastOpener = btn
    dlg.classList.remove('granted')
    dlg.showModal()
    const body = dlg.querySelector('.sys-body')
    body.scrollTop = 0

    if (reduceMotion) {
      dlg.classList.add('granted')
      dlg.querySelector('.sys-title').focus?.()
      return
    }
    dlg.classList.add('accessing')
    setTimeout(() => {
      dlg.classList.remove('accessing')
      dlg.classList.add('granted')
    }, 620)
  })
})

document.querySelectorAll('dialog.sys').forEach((dlg) => {
  dlg.querySelector('.sys-title').setAttribute('tabindex', '-1')
  dlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dlg.close()))
  // click on the backdrop closes
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close() })
  dlg.addEventListener('close', () => {
    dlg.classList.remove('accessing', 'granted')
    if (lastOpener) lastOpener.focus()
  })
})

// ——————————————————————————————————————————————————
// Stack DAG: edges drawn between node buttons, focus shows connections
// ——————————————————————————————————————————————————

const STACK = {
  python: { g: 'Languages', used: 'TMRW work, Spotify ETL (Lambda), stock pipeline (Kafka producer and consumer), IPL analysis' },
  sql: { g: 'Languages', used: 'TMRW work (Databricks SQL), ShopStream, Athena queries in the Spotify and stock pipelines' },
  pyspark: { g: 'Processing', used: 'TMRW work, IPL analysis, ShopStream (Structured Streaming)' },
  spark: { g: 'Processing', used: 'IPL analysis, ShopStream' },
  sparksql: { g: 'Processing', used: 'IPL analysis' },
  databricks: { g: 'Lakehouse', used: 'TMRW work, ShopStream, IPL analysis' },
  delta: { g: 'Lakehouse', used: 'TMRW work, ShopStream (Bronze, Silver, Gold, time travel)' },
  uc: { g: 'Lakehouse', used: 'TMRW work, ShopStream (catalog, schema, volumes, 12 tables)' },
  s3: { g: 'Cloud', used: 'TMRW work, Spotify ETL, stock pipeline, IPL analysis' },
  lambda: { g: 'Cloud', used: 'Spotify ETL (extract and transform functions)' },
  glue: { g: 'Cloud', used: 'Spotify ETL, stock pipeline (crawlers and Data Catalog)' },
  athena: { g: 'Cloud', used: 'Spotify ETL, stock pipeline' },
  ec2: { g: 'Cloud', used: 'Stock pipeline (Kafka host)' },
  eventbridge: { g: 'Cloud', used: 'Spotify ETL (weekly schedule)' },
  kafka: { g: 'Stream & orchestrate', used: 'Stock pipeline' },
  lakeflow: { g: 'Stream & orchestrate', used: 'ShopStream (daily job and declarative pipeline)' },
  airflow: { g: 'Stream & orchestrate', used: '' },
  etl: { g: 'Data', used: 'Every project here, and daily work' },
  dq: { g: 'Data', used: 'TMRW work, ShopStream Silver layer' },
  dv: { g: 'Data', used: 'TMRW work (nulls, duplicates, schema changes, reconciliation)' },
  analytics: { g: 'Data', used: 'TMRW finance analytics, every project here' },
  claude: { g: 'AI-augmented engineering', used: '' },
  mcp: { g: 'AI-augmented engineering', used: '' },
  aidev: { g: 'AI-augmented engineering', used: '' }
}

// which tools are used together, read left to right
const EDGES = [
  ['python', 'pyspark'], ['python', 'lambda'], ['python', 'kafka'],
  ['sql', 'sparksql'], ['sql', 'databricks'], ['sql', 'athena'],
  ['pyspark', 'databricks'], ['pyspark', 'delta'], ['spark', 'databricks'], ['sparksql', 'databricks'],
  ['databricks', 'lakeflow'], ['delta', 's3'], ['delta', 'dq'], ['uc', 'dq'], ['databricks', 'dv'],
  ['s3', 'etl'], ['lambda', 'etl'], ['eventbridge', 'etl'], ['glue', 'athena'], ['athena', 'analytics'], ['ec2', 'kafka'],
  ['kafka', 'etl'], ['lakeflow', 'etl'], ['airflow', 'etl'], ['lakeflow', 'dq']
]

const Dag = (() => {
  const dag = document.getElementById('dag')
  if (!dag) return
  const svg = document.getElementById('dag-edges')
  const info = document.getElementById('dag-info')
  const nodes = new Map([...dag.querySelectorAll('.node')].map((b) => [b.dataset.node, b]))
  const NS = 'http://www.w3.org/2000/svg'
  let paths = []
  let selected = null

  const draw = () => {
    svg.textContent = ''
    paths = []
    if (getComputedStyle(svg).display === 'none') return
    const box = dag.getBoundingClientRect()
    EDGES.forEach(([a, b]) => {
      const A = nodes.get(a)
      const B = nodes.get(b)
      if (!A || !B) return
      const ra = A.getBoundingClientRect()
      const rb = B.getBoundingClientRect()
      // when columns wrap, the target can sit to the left; connect the nearer sides
      const forward = rb.left >= ra.right - 4
      const x1 = (forward ? ra.right : ra.left + ra.width / 2) - box.left
      const y1 = (forward ? ra.top + ra.height / 2 : ra.bottom) - box.top
      const x2 = (forward ? rb.left : rb.left + rb.width / 2) - box.left
      const y2 = (forward ? rb.top + rb.height / 2 : rb.top) - box.top
      const d = forward
        ? `M${x1},${y1} C${x1 + (x2 - x1) * 0.5},${y1} ${x2 - (x2 - x1) * 0.5},${y2} ${x2},${y2}`
        : `M${x1},${y1} C${x1},${y1 + (y2 - y1) * 0.5} ${x2},${y2 - (y2 - y1) * 0.5} ${x2},${y2}`
      ;['base', 'flow'].forEach((kind) => {
        const p = document.createElementNS(NS, 'path')
        p.setAttribute('d', d)
        if (kind === 'flow') p.setAttribute('class', 'flow')
        p.dataset.a = a
        p.dataset.b = b
        svg.append(p)
        paths.push(p)
      })
    })
    if (selected) highlight(selected)
  }

  const neighbours = (id) => EDGES.filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a))

  const highlight = (id) => {
    const near = new Set([id, ...neighbours(id)])
    dag.classList.add('has-focus')
    nodes.forEach((btn, key) => btn.classList.toggle('lit', near.has(key)))
    paths.forEach((p) => p.classList.toggle('hot', p.dataset.a === id || p.dataset.b === id))
  }

  const clear = () => {
    dag.classList.remove('has-focus')
    nodes.forEach((btn) => btn.classList.remove('lit'))
    paths.forEach((p) => p.classList.remove('hot'))
  }

  const describe = (id) => {
    const btn = nodes.get(id)
    const meta = STACK[id] || {}
    const core = btn.classList.contains('core')
    const tier = meta.g === 'AI-augmented engineering' ? 'Tooling' : core ? 'Core stack' : 'Working knowledge'
    const linked = neighbours(id).map((n) => nodes.get(n).textContent)
    info.textContent = ''
    const top = document.createElement('div')
    top.className = 'di-top'
    top.innerHTML = '<span class="di-name"></span><span class="di-tier"></span><span class="di-group"></span>'
    top.children[0].textContent = btn.textContent
    top.children[1].textContent = tier
    top.children[1].classList.toggle('core', core)
    top.children[2].textContent = meta.g || ''
    info.append(top)
    if (meta.used) {
      const p = document.createElement('p')
      p.className = 'di-used'
      p.innerHTML = '<b>Used in:</b> '
      p.append(meta.used)
      info.append(p)
    }
    if (linked.length) {
      const p = document.createElement('p')
      p.className = 'di-links'
      p.textContent = `connects to: ${linked.join(' · ')}`
      info.append(p)
    }
  }

  // on narrow screens the columns stack, so show the details right under the tapped column
  const home = info.previousElementSibling
  const place = (id) => {
    const narrow = window.innerWidth < 640
    const col = nodes.get(id).closest('.dag-col')
    if (narrow && col) col.after(info)
    else if (info.parentElement !== dag) home.after(info)
  }

  const select = (id) => {
    place(id)
    if (selected === id) {
      selected = null
      nodes.get(id).setAttribute('aria-pressed', 'false')
      clear()
      info.innerHTML = '<p class="di-hint">Select a node to inspect it.</p>'
      return
    }
    if (selected) nodes.get(selected).setAttribute('aria-pressed', 'false')
    selected = id
    nodes.get(id).setAttribute('aria-pressed', 'true')
    highlight(id)
    describe(id)
  }

  nodes.forEach((btn, id) => {
    btn.setAttribute('aria-pressed', 'false')
    btn.addEventListener('click', () => select(id))
    btn.addEventListener('mouseenter', () => { if (!selected) highlight(id) })
    btn.addEventListener('mouseleave', () => { if (!selected) clear() })
  })

  let t
  const redraw = () => { clearTimeout(t); t = setTimeout(draw, 120) }
  window.addEventListener('resize', redraw)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw)
  draw()
  return { draw }
})()

// ——————————————————————————————————————————————————
// Data terminal: clickable commands, typing is an optional extra
// ——————————————————————————————————————————————————

const Terminal = (() => {
  const out = document.getElementById('term-out')
  const form = document.getElementById('term-form')
  const input = document.getElementById('term-input')
  if (!out) return

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const row = (k, v) => `<div class="t-row"><span class="t-hl">${esc(k)}</span><span>${v}</span></div>`
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${esc(text)}</a>`

  const COMMANDS = {
    help: () => [
      row('about', 'who I am and what I build'),
      row('stack', 'core stack and working knowledge'),
      row('projects', 'systems I have built'),
      row('experience', 'where I work'),
      row('contact', 'email, LinkedIn, resume'),
      row('github', 'repositories'),
      row('clear', 'clear the screen')
    ].join(''),
    about: () => `<p><b>Suhail Ahmed</b>, Data Engineer, Bengaluru.</p>
      <p>I build pipelines that turn unreliable raw data into trusted analytical datasets, using Python, SQL, PySpark and Databricks on the lakehouse.</p>
      <p class="t-dim">BTech, Computer Science &amp; Engineering, SRM IST, 2025.</p>`,
    stack: () => [
      row('core', 'PYTHON · SQL · PYSPARK · DATABRICKS · DELTA LAKE · UNITY CATALOG · AWS S3'),
      row('working', 'Apache Spark · Spark SQL · Lambda · Glue · Athena · EC2 · EventBridge · Kafka · Lakeflow · Airflow · Docker'),
      row('practice', 'ETL / ELT · data quality · data validation · reconciliation · analytics'),
      row('tooling', 'Claude Code · MCP · AI-assisted development')
    ].join(''),
    projects: () => [
      row('P-01', 'Spotify ETL Pipeline on AWS <span class="t-dim">Lambda, S3, Glue, Athena</span>'),
      row('P-02', 'Real-Time Stock Market Pipeline <span class="t-dim">Kafka, EC2, S3, Athena</span>'),
      row('P-03', 'IPL Data Analysis with Apache Spark <span class="t-dim">PySpark, Databricks</span>'),
      row('P-04', 'ShopStream Databricks Lakehouse <span class="t-dim">Delta, Auto Loader, Lakeflow</span>'),
      '<p class="t-dim">Open any of them in the Projects section: <a href="#projects">#projects</a></p>'
    ].join(''),
    experience: () => [
      row('Aug 2024', '<b>Data Engineer</b>, TMRW / House of Brands <span class="t-hl">(present)</span>'),
      row('input', 'raw finance and e-commerce data on S3'),
      row('process', 'validation → transformation → reconciliation → analytics'),
      row('output', 'trusted business data'),
      row('stack', 'Databricks, PySpark, SQL, Delta Lake')
    ].join(''),
    contact: () => [
      row('email', '<a href="mailto:suhailahmed030803@gmail.com">suhailahmed030803@gmail.com</a>'),
      row('linkedin', link('https://www.linkedin.com/in/suhail--ahmed/', 'in/suhail--ahmed')),
      row('resume', link('https://drive.google.com/file/d/1ThbYjsXAlbOLefxLMoA3nbwoMET0xoo9/view?usp=sharing', 'view PDF'))
    ].join(''),
    github: () => [
      row('profile', link('https://github.com/SuhailAhmedd', 'github.com/SuhailAhmedd')),
      row('repos', link('https://github.com/SuhailAhmedd?tab=repositories', 'all repositories'))
    ].join('')
  }

  const print = (cmd, html, cls = '') => {
    const c = document.createElement('p')
    c.className = 't-cmd'
    c.textContent = cmd
    const block = document.createElement('div')
    if (cls) block.className = cls
    block.innerHTML = html
    out.append(c, block)
    out.scrollTop = out.scrollHeight
  }

  const exec = (raw) => {
    const cmd = raw.trim().toLowerCase().replace(/^\$\s*/, '')
    if (!cmd) return
    if (cmd === 'clear' || cmd === 'cls') { out.innerHTML = ''; return }
    const fn = COMMANDS[cmd]
    if (fn) print(cmd, fn())
    else print(cmd, `command not found: ${esc(cmd)}. Try <b>help</b>.`, 't-err')
  }

  document.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => exec(b.dataset.cmd)))

  const history = []
  let h = 0
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const v = input.value
    if (v.trim()) { history.push(v); h = history.length }
    exec(v)
    input.value = ''
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) { h = Math.max(0, h - 1); input.value = history[h]; e.preventDefault() }
    if (e.key === 'ArrowDown' && history.length) { h = Math.min(history.length, h + 1); input.value = history[h] || ''; e.preventDefault() }
    if (e.key === 'Tab' && input.value) {
      const match = Object.keys(COMMANDS).concat('clear').find((k) => k.startsWith(input.value.toLowerCase()))
      if (match && match !== input.value) { input.value = match; e.preventDefault() }
    }
  })
})()

// ——————————————————————————————————————————————————
// Background: a quiet data plane. Nodes, faint links, packets moving along
// them. ~30fps, paused when the tab is hidden, off on small screens and for
// reduced motion (a single static frame is drawn instead).
// ——————————————————————————————————————————————————

const Plane = (() => {
  const canvas = document.getElementById('bg-canvas')
  if (!canvas || !canvas.getContext) return
  const ctx = canvas.getContext('2d')
  let w = 0
  let h = 0
  let nodes = []
  let links = []
  let packets = []
  let bits = []
  let raf = 0
  let last = 0

  const small = () => window.innerWidth < 640

  const build = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    w = window.innerWidth
    h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const count = small() ? 10 : Math.min(34, Math.round((w * h) / 42000))
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() < 0.2 ? 1.8 : 1.1
    }))
    links = []
    nodes.forEach((n, i) => {
      nodes
        .map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2)
        .forEach(({ j, d }) => {
          if (d < 320 && !links.some((l) => (l.a === j && l.b === i))) links.push({ a: i, b: j, d })
        })
    })
    packets = []
    bits = []
  }

  const drawStatic = () => {
    ctx.clearRect(0, 0, w, h)
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(120, 255, 175, 0.05)'
    links.forEach(({ a, b }) => {
      ctx.beginPath()
      ctx.moveTo(nodes[a].x, nodes[a].y)
      ctx.lineTo(nodes[b].x, nodes[b].y)
      ctx.stroke()
    })
    nodes.forEach((n) => {
      ctx.fillStyle = 'rgba(44, 240, 127, 0.28)'
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const tick = (now) => {
    raf = requestAnimationFrame(tick)
    if (now - last < 33) return
    const dt = Math.min(now - last, 100)
    last = now

    drawStatic()

    // spawn a packet now and then
    if (links.length && packets.length < (small() ? 2 : 6) && Math.random() < 0.04) {
      const l = links[(Math.random() * links.length) | 0]
      const flip = Math.random() < 0.5
      packets.push({ a: flip ? l.b : l.a, b: flip ? l.a : l.b, t: 0, v: 0.00018 + Math.random() * 0.00022 })
    }
    packets = packets.filter((p) => {
      p.t += p.v * dt
      if (p.t >= 1) {
        // a short burst of binary where the packet lands
        if (bits.length < 4 && Math.random() < 0.35) {
          const n = nodes[p.b]
          bits.push({ x: n.x + 6, y: n.y - 6, s: Math.random().toString(2).slice(2, 10), life: 1 })
        }
        return false
      }
      const A = nodes[p.a]
      const B = nodes[p.b]
      const x = A.x + (B.x - A.x) * p.t
      const y = A.y + (B.y - A.y) * p.t
      const tx = A.x + (B.x - A.x) * Math.max(0, p.t - 0.08)
      const ty = A.y + (B.y - A.y) * Math.max(0, p.t - 0.08)
      const g = ctx.createLinearGradient(tx, ty, x, y)
      g.addColorStop(0, 'rgba(44, 240, 127, 0)')
      g.addColorStop(1, 'rgba(44, 240, 127, 0.55)')
      ctx.strokeStyle = g
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.fillStyle = 'rgba(125, 242, 174, 0.8)'
      ctx.beginPath()
      ctx.arc(x, y, 1.4, 0, Math.PI * 2)
      ctx.fill()
      return true
    })

    ctx.font = '10px "JetBrains Mono", monospace'
    bits = bits.filter((b) => {
      b.life -= dt / 2200
      if (b.life <= 0) return false
      ctx.fillStyle = `rgba(44, 240, 127, ${0.22 * b.life})`
      ctx.fillText(b.s, b.x, b.y)
      return true
    })
  }

  const start = () => {
    if (raf) return
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
  }

  const setup = () => {
    stop()
    build()
    if (reduceMotion) drawStatic()
    else start()
  }

  let t
  window.addEventListener('resize', () => {
    // mobile browsers resize on scroll when the URL bar hides; ignore height-only changes
    if (Math.abs(window.innerWidth - w) < 2 && Math.abs(window.innerHeight - h) < 160) return
    clearTimeout(t)
    t = setTimeout(setup, 200)
  })

  document.addEventListener('visibilitychange', () => {
    if (reduceMotion) return
    if (document.hidden) stop()
    else start()
  })

  // start after first paint so it never competes with the hero
  const go = () => { setup(); canvas.classList.add('on') }
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1200 })
  else setTimeout(go, 300)
})()

// ——————————————————————————————————————————————————
// Cursor: a small data point and a ring that reacts to what's under it.
// Fine pointers only, never with reduced motion.
// ——————————————————————————————————————————————————

const Cursor = (() => {
  if (!finePointer || reduceMotion) return
  const cur = document.querySelector('.cur')
  const dot = cur.querySelector('.cur-dot')
  const ring = cur.querySelector('.cur-ring')
  const label = cur.querySelector('.cur-label')
  let x = -100
  let y = -100
  let rx = x
  let ry = y
  let raf = 0
  let started = false

  const loop = () => {
    rx += (x - rx) * 0.2
    ry += (y - ry) * 0.2
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
    if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) raf = requestAnimationFrame(loop)
    else raf = 0
  }

  const setState = (el) => {
    const card = el.closest('[data-cursor="access"]')
    const text = el.closest('input, textarea, .term-out, .sys-body p, .eng dd')
    const interactive = el.closest('a, button, summary, [role="button"]')
    cur.classList.toggle('is-text', !!text && !interactive)
    cur.classList.toggle('is-link', !!interactive && interactive.tagName === 'A')
    cur.classList.toggle('is-hover', !!interactive && interactive.tagName !== 'A')
    cur.classList.toggle('is-access', !!card && !interactive)
    label.textContent = card && !interactive ? 'ACCESS' : ''
  }

  window.addEventListener('mousemove', (e) => {
    x = e.clientX
    y = e.clientY
    if (!started) {
      started = true
      rx = x
      ry = y
      root.classList.add('cursor-on')
    }
    if (!raf) raf = requestAnimationFrame(loop)
  }, { passive: true })

  document.addEventListener('mouseover', (e) => setState(e.target))
  document.addEventListener('mouseleave', () => cur.classList.add('is-out'))
  document.addEventListener('mouseenter', () => cur.classList.remove('is-out'))
  // touch input on a hybrid device: hand back the native cursor
  window.addEventListener('touchstart', () => root.classList.remove('cursor-on'), { passive: true })
})()

// ——————————————————————————————————————————————————
// Contact form
// ——————————————————————————————————————————————————

const contactForm = document.getElementById('contact-form')
const contactEmail = 'suhailahmed030803@gmail.com'

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const status = contactForm.querySelector('.form-status')
  const button = contactForm.querySelector('button[type="submit"]')
  const data = new FormData(contactForm)

  // No Formspree form ID yet: hand the message to the visitor's email app.
  if (contactForm.action.includes('YOUR_FORM_ID')) {
    const subject = `Portfolio message from ${data.get('name')}`
    const body = `${data.get('message')}\n\nFrom: ${data.get('name')} <${data.get('email')}>`
    status.className = 'form-status'
    status.textContent = 'Opening your email app...'
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    return
  }

  button.disabled = true
  status.className = 'form-status'
  status.textContent = 'Transmitting...'

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
    if (!response.ok) throw new Error(response.statusText)
    contactForm.reset()
    status.classList.add('success')
    status.textContent = 'Transmission received. I will get back to you.'
  } catch (err) {
    status.classList.add('error')
    status.textContent = `Transmission failed. Please email me at ${contactEmail}.`
  } finally {
    button.disabled = false
  }
})
