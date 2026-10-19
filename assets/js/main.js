(function () {
  "use strict";

  // Revenue-cycle scenario tabs (home page)
  var tabs = document.querySelectorAll("#cyc [role=tab]");
  function show(i) {
    tabs.forEach(function (tab, k) {
      var on = k === i;
      tab.classList.toggle("on", on);
      tab.setAttribute("aria-selected", on);
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).classList.toggle("on", on);
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { show(i); });
    tab.addEventListener("keydown", function (e) {
      var next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
      if (next === null) return;
      next = (next + tabs.length) % tabs.length;
      show(next);
      tabs[next].focus();
    });
  });

  // Contact form: opens the visitor's email app with the message pre-filled
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var g = function (id) { return document.getElementById(id).value; };
      location.href = "mailto:info@dentalclaimdesk.com?subject=" +
        encodeURIComponent("Inquiry: " + g("s") + " - " + g("p")) +
        "&body=" + encodeURIComponent("Name: " + g("n") + "\nEmail: " + g("e") + "\n\n" + g("m"));
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
