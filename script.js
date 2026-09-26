const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ——————————————————————————————————————————————————
// Navigation: mobile toggle, shadow on scroll, active section
// ——————————————————————————————————————————————————

const topbar = document.querySelector('.topbar')
const navToggle = document.getElementById('nav-toggle')
const navList = document.getElementById('nav-links')

const setMenu = (open) => {
  navList.classList.toggle('open', open)
  navToggle.setAttribute('aria-expanded', String(open))
}

navToggle.addEventListener('click', () => setMenu(!navList.classList.contains('open')))
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false) })

// in-page links scroll smoothly (via CSS scroll-behavior) and close the menu
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', () => setMenu(false))
})

const navLinks = [...navList.querySelectorAll('a')]
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href')))

const onScroll = () => {
  topbar.classList.toggle('scrolled', window.scrollY > 8)

  const y = window.scrollY + window.innerHeight * 0.35
  let current = sections[0]
  sections.forEach((s) => { if (s && s.offsetTop <= y) current = s })
  // the last section is short, so treat the bottom of the page as reaching it
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = sections[sections.length - 1]
  navLinks.forEach((a) => {
    const on = a.getAttribute('href') === `#${current.id}`
    a.classList.toggle('active', on)
    if (on) a.setAttribute('aria-current', 'true')
    else a.removeAttribute('aria-current')
  })
}

window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

// ——————————————————————————————————————————————————
// Reveal on scroll
// ——————————————————————————————————————————————————

const revealEls = document.querySelectorAll('.reveal')

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('in'))
} else {
  // content is only hidden once this observer is ready to reveal it again
  document.documentElement.classList.add('reveal-on')
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in')
        io.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
  revealEls.forEach((el) => io.observe(el))
}

// ——————————————————————————————————————————————————
// Hero terminal: type the command, then print the output
// ——————————————————————————————————————————————————

const term = document.getElementById('hero-term')

if (term && !reduceMotion) {
  const lines = [...term.querySelectorAll('.ln')]
  const typed = term.querySelector('.typed')
  const text = typed.dataset.text
  typed.textContent = ''
  term.classList.add('play')
  lines[0].classList.add('on')

  let i = 0
  const type = () => {
    typed.textContent = text.slice(0, ++i)
    if (i < text.length) setTimeout(type, 45 + Math.random() * 45)
    else lines.slice(1).forEach((l, n) => setTimeout(() => l.classList.add('on'), 350 + n * 260))
  }
  setTimeout(type, 600)
}

// ——————————————————————————————————————————————————
// Digital rain: sparse, faint, hero only
// ——————————————————————————————————————————————————

const canvas = document.querySelector('.rain')

if (canvas && !reduceMotion) {
  const ctx = canvas.getContext('2d')
  const glyphs = '0123456789ABCDEF{}[]<>=+*:;'
  let size = 16
  let columns = []
  let width = 0
  let height = 0
  let visible = true
  let last = 0

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const mobile = window.innerWidth < 760
    size = mobile ? 18 : 16
    width = canvas.offsetWidth
    height = canvas.offsetHeight
    canvas.width = width * ratio
    canvas.height = height * ratio
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, width, height)
    // only some columns carry a stream; fewer still on small screens
    const density = mobile ? 0.18 : 0.32
    columns = Array.from({ length: Math.ceil(width / size) }, () => ({
      y: Math.random() * -height,
      speed: 0.35 + Math.random() * 0.7,
      active: Math.random() < density,
      density
    }))
  }

  const draw = (t) => {
    requestAnimationFrame(draw)
    if (!visible || t - last < 60) return
    last = t
    // fade the previous frame towards transparent to leave short trails
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-over'
    ctx.font = `${size - 3}px "JetBrains Mono", monospace`
    columns.forEach((c, i) => {
      if (!c.active) return
      const ch = glyphs[Math.floor(Math.random() * glyphs.length)]
      ctx.fillStyle = Math.random() < 0.05 ? 'rgba(200, 255, 220, 0.85)' : 'rgba(0, 255, 102, 0.5)'
      ctx.fillText(ch, i * size, c.y)
      c.y += size * c.speed
      if (c.y > height + size) {
        c.y = Math.random() * -240
        c.active = Math.random() < c.density
      }
    })
  }

  // stop drawing when the hero is off screen or the tab is hidden
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && !document.hidden })
    .observe(canvas)
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden && canvas.getBoundingClientRect().bottom > 0
  })

  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(resize, 150)
  })
  resize()
  requestAnimationFrame(draw)
}

// ——————————————————————————————————————————————————
// Screenshot lightbox
// ——————————————————————————————————————————————————

const lightbox = document.getElementById('lightbox')

if (lightbox && typeof lightbox.showModal === 'function') {
  const lbImg = lightbox.querySelector('img')

  document.querySelectorAll('.shot-open').forEach((btn) => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img')
      lbImg.src = btn.dataset.full
      lbImg.alt = img.alt
      lightbox.showModal()
    })
  })

  lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close())
  // click on the backdrop closes it
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close() })
} else {
  // no <dialog> support: open the image in a new tab instead
  document.querySelectorAll('.shot-open').forEach((btn) => {
    btn.addEventListener('click', () => window.open(btn.dataset.full, '_blank', 'noopener'))
  })
}

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
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    return
  }

  button.disabled = true
  status.className = 'form-status'
  status.textContent = 'Sending...'

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
    if (!response.ok) throw new Error(response.statusText)
    contactForm.reset()
    status.classList.add('success')
    status.textContent = 'Thanks! Your message has been sent.'
  } catch (err) {
    status.classList.add('error')
    status.textContent = `Sorry, something went wrong. Please email me at ${contactEmail}.`
  } finally {
    button.disabled = false
  }
})
