const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ——————————————————————————————————————————————————
// Mobile sidebar toggle
// ——————————————————————————————————————————————————

const menu = document.getElementById('menu')
const sidebar = document.querySelector('body > header')

const setMenu = (open) => {
  sidebar.classList.toggle('toggle', open)
  menu.classList.toggle('fa-times', open)
  menu.classList.toggle('fa-bars', !open)
  menu.setAttribute('aria-expanded', String(open))
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation')
}

menu.addEventListener('click', () => setMenu(!sidebar.classList.contains('toggle')))
window.addEventListener('scroll', () => { if (sidebar.classList.contains('toggle')) setMenu(false) }, { passive: true })

// in-page links scroll smoothly (via CSS scroll-behavior) and close the menu
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', () => setMenu(false))
})

// ——————————————————————————————————————————————————
// Active section in the sidebar
// ——————————————————————————————————————————————————

const navLinks = document.querySelectorAll('.navbar a')
const sections = [...navLinks].map((a) => document.querySelector(a.getAttribute('href')))

const setActive = () => {
  const y = window.scrollY + window.innerHeight * 0.35
  let current = sections[0]
  sections.forEach((s) => { if (s && s.offsetTop <= y) current = s })
  navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${current.id}`))
}

window.addEventListener('scroll', setActive, { passive: true })
setActive()

// ——————————————————————————————————————————————————
// Reveal on scroll
// ——————————————————————————————————————————————————

const revealEls = document.querySelectorAll('.reveal')

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('in'))
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in')
        io.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12 })
  revealEls.forEach((el) => io.observe(el))
}

// ——————————————————————————————————————————————————
// Hero pipeline log: print one line at a time
// ——————————————————————————————————————————————————

const runLog = document.getElementById('run-log')

if (runLog && !reduceMotion) {
  const lines = runLog.innerHTML.split('\n')
  runLog.innerHTML = lines.map((l) => `<span class="line">${l}</span>`).join('')
  const spans = runLog.querySelectorAll('.line')
  const play = () => {
    spans.forEach((s) => s.classList.remove('shown'))
    spans.forEach((s, i) => setTimeout(() => s.classList.add('shown'), 400 + i * 550))
  }
  play()
  setInterval(play, 14000)
}

// ——————————————————————————————————————————————————
// Hero data stream: slow columns of hex/binary, kept faint
// ——————————————————————————————————————————————————

const canvas = document.querySelector('.data-rain')

if (canvas && !reduceMotion) {
  const ctx = canvas.getContext('2d')
  const glyphs = '01ABCDEF{}[]<>=:;#$'
  const size = 14
  let columns = []
  let width = 0
  let height = 0

  const resize = () => {
    const ratio = window.devicePixelRatio || 1
    width = canvas.offsetWidth
    height = canvas.offsetHeight
    canvas.width = width * ratio
    canvas.height = height * ratio
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    // only every other column carries a stream, which keeps it sparse
    columns = Array.from({ length: Math.ceil(width / size) }, () => ({
      y: Math.random() * -height,
      speed: 0.4 + Math.random() * 0.9,
      active: Math.random() < 0.45
    }))
  }

  let last = 0
  const draw = (t) => {
    requestAnimationFrame(draw)
    if (t - last < 50 || window.scrollY > height) return
    last = t
    ctx.fillStyle = 'rgba(5, 9, 10, 0.16)'
    ctx.fillRect(0, 0, width, height)
    ctx.font = `${size - 2}px "JetBrains Mono", monospace`
    columns.forEach((c, i) => {
      if (!c.active) return
      const ch = glyphs[Math.floor(Math.random() * glyphs.length)]
      ctx.fillStyle = Math.random() < 0.04 ? 'rgba(190, 255, 215, 0.9)' : 'rgba(61, 255, 142, 0.55)'
      ctx.fillText(ch, i * size, c.y)
      c.y += size * c.speed
      if (c.y > height + size) {
        c.y = Math.random() * -200
        c.active = Math.random() < 0.45
      }
    })
  }

  resize()
  window.addEventListener('resize', resize)
  requestAnimationFrame(draw)
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
