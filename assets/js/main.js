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

  // Contact form: sent to contact.php on our own server, which emails the office
  var form = document.getElementById("contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector("button[type=submit]");
    var say = function (text, ok) {
      status.textContent = text;
      status.className = "form-status " + (ok ? "ok" : "err");
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      button.disabled = true;
      button.textContent = "Sending…";
      say("", true);
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          say(data.message, data.ok);
          if (data.ok) form.reset();
        })
        .catch(function () {
          say("Sorry, your message could not be sent. Please email us directly at info@dentalclaimdesk.com.", false);
        })
        .then(function () {
          button.disabled = false;
          button.textContent = "Send message";
        });
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
