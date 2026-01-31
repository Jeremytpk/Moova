// Moova Corporate Website - JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Language selector logic
  const langFrBtn = document.getElementById('lang-fr');
  if (langFrBtn) {
    langFrBtn.addEventListener('click', function() {
      setLanguage('fr');
      applyTranslations('fr');
    });
  }

  // On page load, apply language if not English
  const userLang = getLanguage();
  if (userLang === 'fr') {
    applyTranslations('fr');
  }
  // Mobile navigation toggle
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarMenu = document.querySelector('.navbar-menu');

  if (navbarToggle && navbarMenu) {
    navbarToggle.addEventListener('click', function() {
      navbarMenu.classList.toggle('active');

      // Animate hamburger to X
      const spans = navbarToggle.querySelectorAll('span');
      spans.forEach(span => span.classList.toggle('active'));
    });

    // Close menu when clicking on a link
    const navLinks = navbarMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        navbarMenu.classList.remove('active');
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Navbar background on scroll
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Form submission handler
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);

      // Try to send to Firestore (requires Firebase SDK loaded)
      let sent = false;
      let errorMsg = '';
      if (window.firebase && firebase.firestore) {
        try {
          await firebase.firestore().collection('messages').add({
            name: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message,
            createdAt: new Date().toISOString()
          });
          sent = true;
        } catch (err) {
          errorMsg = err.message || 'Failed to send message.';
        }
      } else {
        errorMsg = 'Message service unavailable.';
      }

      if (sent) {
        alert('Your message was sent successfully! We will get back to you within 24-48 hours.');
        contactForm.reset();
      } else {
        alert('Failed to send your message. ' + errorMsg);
      }
    });
  }

  // Animate elements on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.feature-card, .step-item, .stat-item, .value-card').forEach(el => {
    el.classList.add('animate-on-scroll');
    observer.observe(el);
  });

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    .animate-on-scroll {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .navbar.scrolled {
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
  `;
  document.head.appendChild(style);

  // Set active nav link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});

// Utility function for language toggle (if needed in future)
function setLanguage(lang) {
  localStorage.setItem('moova-language', lang);
  // Optionally reload or update content based on language
}
// End of main.js

// Apply translations to the page
function applyTranslations(lang) {
  if (lang === 'fr' && window.MOOVA_TRANSLATIONS_FR) {
    const t = window.MOOVA_TRANSLATIONS_FR;
    // Navbar
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.getAttribute('data-translate');
      const keys = key.split('.');
      let value = t;
      for (const k of keys) {
        value = value && value[k];
      }
      if (value) {
        el.textContent = value;
      }
    });
    // Hero section
    const heroTitle = document.querySelector('.hero-text h1');
    if (heroTitle) heroTitle.textContent = t.hero.title;
    const heroDesc = document.querySelector('.hero-text p');
    if (heroDesc) heroDesc.textContent = t.hero.description;
    const heroBtns = document.querySelectorAll('.hero-buttons a');
    if (heroBtns[0]) heroBtns[0].textContent = t.hero.download;
    if (heroBtns[1]) heroBtns[1].textContent = t.hero.learnMore;
    // Features section
    const featuresHeader = document.querySelector('.features .section-header h2');
    if (featuresHeader) featuresHeader.textContent = t.features.whyChoose;
    const featuresSub = document.querySelector('.features .section-header p');
    if (featuresSub) featuresSub.textContent = t.features.subtitle;
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards[0]) { featureCards[0].querySelector('h3').textContent = t.features.affordable.title; featureCards[0].querySelector('p').textContent = t.features.affordable.desc; }
    if (featureCards[1]) { featureCards[1].querySelector('h3').textContent = t.features.secure.title; featureCards[1].querySelector('p').textContent = t.features.secure.desc; }
    if (featureCards[2]) { featureCards[2].querySelector('h3').textContent = t.features.community.title; featureCards[2].querySelector('p').textContent = t.features.community.desc; }
    if (featureCards[3]) { featureCards[3].querySelector('h3').textContent = t.features.tracking.title; featureCards[3].querySelector('p').textContent = t.features.tracking.desc; }
    if (featureCards[4]) { featureCards[4].querySelector('h3').textContent = t.features.chat.title; featureCards[4].querySelector('p').textContent = t.features.chat.desc; }
    if (featureCards[5]) { featureCards[5].querySelector('h3').textContent = t.features.coverage.title; featureCards[5].querySelector('p').textContent = t.features.coverage.desc; }
    // Stats section
    const statLabels = document.querySelectorAll('.stat-label');
    if (statLabels[0]) statLabels[0].textContent = t.stats.countries;
    if (statLabels[1]) statLabels[1].textContent = t.stats.states;
    if (statLabels[2]) statLabels[2].textContent = t.stats.languages;
    if (statLabels[3]) statLabels[3].textContent = t.stats.support;
    // How it works section
    const hiwHeader = document.querySelector('.how-it-works .section-header h2');
    if (hiwHeader) hiwHeader.textContent = t.howItWorks.title;
    const hiwSub = document.querySelector('.how-it-works .section-header p');
    if (hiwSub) hiwSub.textContent = t.howItWorks.subtitle;
    const hiwCols = document.querySelectorAll('.steps-column');
    if (hiwCols[0]) hiwCols[0].querySelector('h3').textContent = t.howItWorks.senders;
    if (hiwCols[1]) hiwCols[1].querySelector('h3').textContent = t.howItWorks.travelers;
    const senderSteps = hiwCols[0] ? hiwCols[0].querySelectorAll('.step-item') : [];
    t.howItWorks.senderSteps.forEach((step, i) => {
      if (senderSteps[i]) {
        senderSteps[i].querySelector('h4').textContent = step.title;
        senderSteps[i].querySelector('p').textContent = step.desc;
      }
    });
    const travelerSteps = hiwCols[1] ? hiwCols[1].querySelectorAll('.step-item') : [];
    t.howItWorks.travelerSteps.forEach((step, i) => {
      if (travelerSteps[i]) {
        travelerSteps[i].querySelector('h4').textContent = step.title;
        travelerSteps[i].querySelector('p').textContent = step.desc;
      }
    });
    const hiwBtn = document.querySelector('.how-it-works .btn-primary');
    if (hiwBtn) hiwBtn.textContent = t.howItWorks.learnMore;
    // Coverage section
    const covHeader = document.querySelector('.coverage .section-header h2');
    if (covHeader) covHeader.textContent = t.coverage.title;
    const covSub = document.querySelector('.coverage .section-header p');
    if (covSub) covSub.textContent = t.coverage.subtitle;
    const covLists = document.querySelectorAll('.coverage-list h3');
    if (covLists[0]) covLists[0].textContent = t.coverage.us;
    if (covLists[1]) covLists[1].textContent = t.coverage.africa;
    const covMore = document.querySelector('.coverage-list ul li:last-child');
    if (covMore) covMore.textContent = t.coverage.more;
    // CTA section
    const ctaHeader = document.querySelector('.cta h2');
    if (ctaHeader) ctaHeader.textContent = t.cta.title;
    const ctaDesc = document.querySelector('.cta p');
    if (ctaDesc) ctaDesc.textContent = t.cta.desc;
    const ctaBtns = document.querySelectorAll('.cta-buttons a');
    if (ctaBtns[0]) ctaBtns[0].textContent = t.cta.download;
    if (ctaBtns[1]) ctaBtns[1].textContent = t.cta.contact;
    // Footer
    const footerAbout = document.querySelector('.footer-about p');
    if (footerAbout) footerAbout.textContent = t.footer.about;
    const footerLinks = document.querySelectorAll('.footer-links-column h4');
    if (footerLinks[0]) footerLinks[0].textContent = t.footer.company;
    if (footerLinks[1]) footerLinks[1].textContent = t.footer.legal;
    if (footerLinks[2]) footerLinks[2].textContent = t.footer.support;
    const footerLegalLinks = document.querySelectorAll('.footer-links-column ul.footer-links li a');
    if (footerLegalLinks[4]) footerLegalLinks[4].textContent = t.footer.privacy;
    if (footerLegalLinks[5]) footerLegalLinks[5].textContent = t.footer.terms;
    const footerSupportLinks = document.querySelectorAll('.footer-links-column ul.footer-links li a');
    if (footerSupportLinks[6]) footerSupportLinks[6].textContent = t.footer.help;
    if (footerSupportLinks[7]) footerSupportLinks[7].textContent = t.footer.faq;
    const copyright = document.querySelector('.footer-bottom p');
    if (copyright) copyright.innerHTML = `&copy; 2025 Moova Africa. ${t.footer.copyright}`;
  }
}
}

function getLanguage() {
  return localStorage.getItem('moova-language') || 'en';
}
