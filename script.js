const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ——————————————————————————————————————————————————
// Scramble: text decodes from random glyphs into its final value
//
//   <span data-scramble>Suhail Ahmed</span>          decodes once when it enters the viewport
//   data-scramble-delay="250"                         start later (ms)
//   data-scramble-card                                also re-decodes briefly when its .card-hover is hovered
//   <span data-scramble-hover>About</span>            decodes briefly when it (or its enclosing link) is hovered / focused
//
// The real text stays in the DOM for screen readers and layout: the visible
// glyphs are an aria-hidden overlay on top of an invisible copy, so the box
// never changes size while it animates.
// ——————————————————————————————————————————————————

const Scramble = (() => {
  const GLYPHS = '01X#@%/\\<>_+*?'
  const running = new WeakMap()

  const prepare = (el) => {
    if (el.dataset.scrambleReady) return
    const text = el.textContent
    el.dataset.scrambleText = text
    el.classList.add('scr')
    el.innerHTML = ''
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
    if (reduceMotion) return
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
      // swap glyphs every ~45ms so it reads as decoding, not flicker
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
    const onView = document.querySelectorAll('[data-scramble]')
    onView.forEach(prepare)

    if (!reduceMotion && 'IntersectionObserver' in window) {
      // until it decodes, show a static scrambled line of the same length
      onView.forEach((el) => {
        const text = el.dataset.scrambleText
        el.querySelector('.scr-layer').textContent = [...text].map((ch) => (ch === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('')
        el.classList.add('scr-on')
      })
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target
          io.unobserve(el)
          setTimeout(() => run(el, 700), Number(el.dataset.scrambleDelay || 0))
        })
      }, { threshold: 0.6 })
      onView.forEach((el) => io.observe(el))
    }

    // short decode on hover / keyboard focus
    document.querySelectorAll('[data-scramble-hover]').forEach((el) => {
      prepare(el)
      const target = el.closest('a, button') || el
      target.addEventListener('mouseenter', () => run(el, 320))
      target.addEventListener('focus', () => run(el, 320))
    })

    document.querySelectorAll('[data-scramble-card]').forEach((el) => {
      const card = el.closest('.card-hover')
      if (card) card.addEventListener('mouseenter', () => run(el, 420))
    })
  }

  return { init, run }
})()

Scramble.init()

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

const navLinks = [...navList.querySelectorAll('a[href^="#"]')]
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href')))

const onScroll = () => {
  topbar.classList.toggle('scrolled', window.scrollY > 8)

  const y = window.scrollY + window.innerHeight * 0.35
  let current = null
  sections.forEach((s) => { if (s && s.offsetTop <= y) current = s })
  // the last section is short, so treat the bottom of the page as reaching it
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = sections[sections.length - 1]
  navLinks.forEach((a) => {
    const on = current !== null && a.getAttribute('href') === `#${current.id}`
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
// Hero lifecycle panel: stages come online one after another
// ——————————————————————————————————————————————————

const lifecycle = document.getElementById('lifecycle')

if (lifecycle && !reduceMotion) {
  const stages = [...lifecycle.querySelectorAll('.lc-stages li')]
  lifecycle.classList.add('boot')
  stages.forEach((li, i) => {
    setTimeout(() => li.classList.add('on'), 600 + i * 220)
    setTimeout(() => li.classList.add('settled'), 900 + i * 220)
  })
  setTimeout(() => lifecycle.classList.add('online'), 900 + stages.length * 220)
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
