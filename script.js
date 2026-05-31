/* ============================================
   LOHAR AUTO GARAGE - JavaScript
   Interactions, Animations & Functionality
============================================ */

// ---- PRELOADER ----
window.addEventListener('load', () => {
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('hidden');
      setTimeout(() => preloader.remove(), 600);
    }
    initParticles();
    initScrollReveal();
  }, 1800);
});

// ---- NAVBAR SCROLL ----
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  updateActiveNav();
});

function updateActiveNav() {
  let current = '';
  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

// ---- MOBILE HAMBURGER ----
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinksEl.classList.toggle('open');
  document.body.style.overflow = navLinksEl.classList.contains('open')
    ? 'hidden'
    : '';
});

navLinksEl.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinksEl.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ---- PARTICLES ----
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  const count = 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.left = Math.random() * 100 + '%';
    p.style.width = Math.random() * 3 + 1 + 'px';
    p.style.height = p.style.width;
    p.style.animationDuration = Math.random() * 10 + 8 + 's';
    p.style.animationDelay = Math.random() * 8 + 's';
    p.style.opacity = Math.random() * 0.6 + 0.1;
    container.appendChild(p);
  }
}

// ---- SCROLL REVEAL ----
function initScrollReveal() {
  const revealEls = document.querySelectorAll(
    '.product-card, .why-card, .testimonial-card, .contact-card, .about-img-wrapper, .about-content, .dealer-form, .dealer-content',
  );
  revealEls.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, 100);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  revealEls.forEach((el) => observer.observe(el));
}

// ---- BEFORE / AFTER SLIDER ----
(function initBASlider() {
  const slider = document.getElementById('baSlider');
  const handle = document.getElementById('baHandle');
  const beforeEl = slider ? slider.querySelector('.ba-before') : null;
  if (!slider || !handle || !beforeEl) return;

  let isDragging = false;
  let currentPosition = 50;

  function setPosition(pct) {
    pct = Math.min(Math.max(pct, 2), 98);
    currentPosition = pct;
    beforeEl.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = pct + '%';
  }

  function getPercentFromEvent(e) {
    const rect = slider.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return ((clientX - rect.left) / rect.width) * 100;
  }

  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    e.preventDefault();
  });
  slider.addEventListener('mousedown', (e) => {
    isDragging = true;
    setPosition(getPercentFromEvent(e));
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (isDragging) setPosition(getPercentFromEvent(e));
  });

  // Touch support
  handle.addEventListener(
    'touchstart',
    (e) => {
      isDragging = true;
    },
    { passive: true },
  );
  slider.addEventListener(
    'touchstart',
    (e) => {
      setPosition(getPercentFromEvent(e));
    },
    { passive: true },
  );
  window.addEventListener('touchend', () => {
    isDragging = false;
  });
  window.addEventListener(
    'touchmove',
    (e) => {
      if (isDragging) setPosition(getPercentFromEvent(e));
    },
    { passive: true },
  );

  // Animate slider in on scroll
  const baObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateSlider();
          baObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 },
  );
  if (slider) baObserver.observe(slider);

  function animateSlider() {
    let pos = 0;
    const target = 50;
    const duration = 1200;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setPosition(ease * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
})();

// ---- TESTIMONIALS SLIDER ----
(function initTestimonialsSlider() {
  const track = document.getElementById('testimonialsTrack');
  const prevBtn = document.getElementById('prevTestimonial');
  const nextBtn = document.getElementById('nextTestimonial');
  const dotsContainer = document.getElementById('sliderDots');
  if (!track || !prevBtn || !nextBtn) return;

  const cards = track.querySelectorAll('.testimonial-card');
  let cardsVisible = getCardsVisible();
  let current = 0;
  const total = Math.ceil(cards.length / cardsVisible);
  let autoPlay;

  function getCardsVisible() {
    return window.innerWidth < 600 ? 1 : window.innerWidth < 900 ? 1 : 3;
  }

  function buildDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('div');
      dot.classList.add('slider-dot');
      if (i === current) dot.classList.add('active');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    dotsContainer.querySelectorAll('.slider-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function goTo(index) {
    current = ((index % total) + total) % total;
    const cardWidth = cards[0].offsetWidth + 24;
    track.style.transform = `translateX(-${current * cardsVisible * cardWidth}px)`;
    updateDots();
  }

  nextBtn.addEventListener('click', () => {
    goTo(current + 1);
    resetAutoPlay();
  });
  prevBtn.addEventListener('click', () => {
    goTo(current - 1);
    resetAutoPlay();
  });

  function resetAutoPlay() {
    clearInterval(autoPlay);
    autoPlay = setInterval(() => goTo(current + 1), 4500);
  }

  buildDots();
  resetAutoPlay();

  window.addEventListener('resize', () => {
    cardsVisible = getCardsVisible();
    goTo(0);
  });
})();

// ---- DEALER FORM ----
function submitDealerForm(e) {
  e.preventDefault();
  const form = document.getElementById('dealerForm');
  const success = document.getElementById('formSuccess');
  const btn = document.getElementById('dealerSubmitBtn');

  btn.innerHTML = '<span>Sending...</span>';
  btn.style.opacity = '0.7';
  btn.disabled = true;

  // Simulate submission
  setTimeout(() => {
    form.style.display = 'none';
    success.classList.add('visible');
  }, 1500);
}

// ---- SMOOTH SCROLL ----
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const offset = 80;
      const targetPos =
        target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: targetPos, behavior: 'smooth' });
    }
  });
});

// ---- COUNTER ANIMATION ----
function animateCounter(el, target, suffix = '') {
  const duration = 2000;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(ease * target);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const raw = el.dataset.target;
        const suffix = el.dataset.suffix || '';
        animateCounter(el, parseInt(raw), suffix);
        counterObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.5 },
);

document
  .querySelectorAll('[data-target]')
  .forEach((el) => counterObserver.observe(el));

// ---- HERO BOTTLE PARALLAX ----
document.addEventListener('mousemove', (e) => {
  const bottle = document.getElementById('heroBottle');
  if (!bottle) return;
  const rect = bottle.getBoundingClientRect();
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const deltaX = (e.clientX - centerX) / centerX;
  const deltaY = (e.clientY - centerY) / centerY;
  bottle.style.transform = `translate(${deltaX * 10}px, ${deltaY * 8}px)`;
});

// ---- NAVBAR ACTIVE ON SCROLL ----
document.addEventListener('DOMContentLoaded', () => {
  updateActiveNav();
});

// ---- PRODUCT CARD TILT ----
document.querySelectorAll('.product-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ---- FLOATING WHATSAPP PULSE ----
(function () {
  const floatBtn = document.getElementById('floatWhatsApp');
  if (!floatBtn) return;
  let pulse = true;
  setInterval(() => {
    if (pulse) {
      floatBtn.style.boxShadow =
        '0 8px 28px rgba(37, 211, 102, 0.7), 0 0 0 12px rgba(37,211,102,0.1)';
    } else {
      floatBtn.style.boxShadow = '0 8px 28px rgba(37, 211, 102, 0.5)';
    }
    pulse = !pulse;
  }, 1500);
})();

console.log(
  '%c LOHAR AUTO GARAGE ',
  'background: #f5c518; color: #000; font-size: 18px; font-weight: bold; padding: 8px 16px; border-radius: 8px;',
);
console.log(
  '%c Professional Engine Cleaning Solutions ',
  'color: #f5c518; font-size: 12px;',
);
