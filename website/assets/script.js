// NovaAI — interactions de base
(function () {
  'use strict';

  // Année dans le footer
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header au scroll
  var header = document.getElementById('site-header');
  var onScroll = function () {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu mobile
  var toggle = document.getElementById('nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Formulaire (démo : pas d'envoi réel)
  var form = document.getElementById('contact-form');
  var feedback = document.getElementById('form-feedback');
  if (form && feedback) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      if (!name || !email) {
        feedback.textContent = 'Merci de renseigner votre nom et votre e-mail.';
        feedback.classList.add('show', 'error');
        return;
      }
      feedback.classList.remove('error');
      feedback.classList.add('show');
      feedback.textContent = 'Merci ' + name + ' ! Nous vous recontactons sous 24h ouvrées.';
      form.reset();
      setTimeout(function () { feedback.classList.remove('show'); }, 6000);
    });
  }

  // Animation d'apparition douce
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.service-card, .feature, .step, .price-card, .quote').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 600ms ease, transform 600ms ease';
      io.observe(el);
    });
  }
})();
