(function () {
  "use strict";

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
      toggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }

  // Header shadow on scroll
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Count-up numbers: <span data-count="98" data-suffix="%">
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Reveal, counters and progress bars when scrolled into view
  var watched = document.querySelectorAll(".reveal, [data-count], [data-progress]");
  function activate(el) {
    if (el.classList.contains("reveal")) el.classList.add("in");
    if (el.hasAttribute("data-count")) animateCount(el);
    if (el.hasAttribute("data-progress")) el.style.width = el.getAttribute("data-progress") + "%";
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    watched.forEach(function (el) { io.observe(el); });
  } else {
    watched.forEach(activate);
  }

  // Testimonial slider
  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    var track = slider.querySelector(".slider-track");
    var cards = track.children;
    var dotsWrap = slider.querySelector(".slider-dots");
    var index = 0;
    var timer;

    function perView() { return window.innerWidth < 768 ? 1 : 2; }
    function pages() { return Math.max(cards.length - perView() + 1, 1); }

    function buildDots() {
      dotsWrap.innerHTML = "";
      for (var i = 0; i < pages(); i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Show testimonial " + (i + 1));
        b.addEventListener("click", (function (n) { return function () { go(n); restart(); }; })(i));
        dotsWrap.appendChild(b);
      }
    }

    function go(n) {
      index = (n + pages()) % pages();
      var gap = parseFloat(getComputedStyle(track).gap) || 0;
      var offset = index * (cards[0].getBoundingClientRect().width + gap);
      track.style.transform = "translateX(" + -offset + "px)";
      Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
        d.classList.toggle("active", i === index);
      });
    }

    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { go(index + 1); }, 5000);
    }

    buildDots();
    go(0);
    restart();
    slider.addEventListener("mouseenter", function () { clearInterval(timer); });
    slider.addEventListener("mouseleave", restart);
    window.addEventListener("resize", function () { buildDots(); go(Math.min(index, pages() - 1)); });
  });

  // Video modal: set data-video to a YouTube/Vimeo embed URL
  var modal = document.querySelector(".modal");
  if (modal) {
    var inner = modal.querySelector(".modal-body");
    function closeModal() {
      modal.classList.remove("open");
      inner.innerHTML = "";
    }
    document.querySelectorAll("[data-video]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = btn.getAttribute("data-video");
        inner.innerHTML = url
          ? '<iframe src="' + url + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
          : "<p>Your video will play here.<br>Add an embed URL to the button's data-video attribute.</p>";
        modal.classList.add("open");
      });
    });
    modal.querySelector(".modal-close").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  }

  // Forms: client-side validation + confirmation message.
  // Connect these to your form backend (Formspree, Netlify Forms, your own API, etc.).
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field") || input.parentElement;
        var valid = input.type === "checkbox" ? input.checked : input.value.trim() !== "" && input.checkValidity();
        if (field) field.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      var msg = form.querySelector(".form-success, .form-note");
      if (!ok) {
        if (msg && msg.classList.contains("form-note")) msg.textContent = "Please enter a valid email address.";
        return;
      }
      if (msg) {
        msg.textContent = form.getAttribute("data-success") || "Thank you! We'll be in touch shortly.";
        msg.classList.add("show");
      }
      form.reset();
    });
  });

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
