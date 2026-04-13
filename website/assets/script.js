// NovaAI — interactions
(function () {
  'use strict';

  // Année dans le footer
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Formulaire de contact (démo, pas d'envoi réel)
  var form = document.getElementById('contact-form');
  var feedback = document.getElementById('form-feedback');
  if (form && feedback) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      if (!name || !email) {
        feedback.textContent = 'merci de remplir votre nom et votre e-mail ♥';
        feedback.classList.add('show', 'error');
        return;
      }
      feedback.classList.remove('error');
      feedback.classList.add('show');
      feedback.textContent = 'merci ' + name + ' ! on vous recontacte très vite ✨';
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
          entry.target.style.transform = entry.target.dataset.origTransform || 'translateY(0)';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.paper-card').forEach(function (el) {
      var cs = window.getComputedStyle(el);
      el.dataset.origTransform = cs.transform === 'none' ? '' : cs.transform;
      el.style.opacity = '0';
      el.style.transform = (el.dataset.origTransform || '') + ' translateY(18px)';
      el.style.transition = 'opacity 500ms ease, transform 500ms ease';
      io.observe(el);
    });
  }
})();
