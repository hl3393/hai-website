/* =========================================================
   Human Alignment Institute — small helper script
   ---------------------------------------------------------
   1. Opens/closes the menu on small screens.
   2. Filters the Voices page by field and by type.
   3. Fills in the current year in the footer.
   The site still works if JavaScript is turned off
   (the menu stays open and all voices are shown).
   ========================================================= */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  document.addEventListener("DOMContentLoaded", function () {
    /* ---- 1. Mobile menu ---- */
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });
    }

    /* ---- 2. Voices filters ---- */
    var bar = document.querySelector("[data-filters]");
    var list = document.querySelector("[data-filter-list]");
    if (bar && list) {
      var cards = Array.prototype.slice.call(list.querySelectorAll(".voice-card"));
      var buttons = Array.prototype.slice.call(bar.querySelectorAll(".filter-btn"));
      var status = bar.querySelector("[data-filter-status]");
      var empty = document.querySelector("[data-filter-empty]");
      var state = { field: "all", type: "all" };

      // Allow links such as voices.html?field=arts&type=video
      var params = new URLSearchParams(window.location.search);
      ["field", "type"].forEach(function (group) {
        var value = params.get(group);
        if (value && bar.querySelector('[data-filter-group="' + group + '"][data-value="' + value + '"]')) {
          state[group] = value;
        }
      });

      var apply = function (updateUrl) {
        var shown = 0;
        cards.forEach(function (card) {
          var ok =
            (state.field === "all" || card.getAttribute("data-field") === state.field) &&
            (state.type === "all" || card.getAttribute("data-type") === state.type);
          card.hidden = !ok;
          if (ok) shown++;
        });
        buttons.forEach(function (btn) {
          var group = btn.getAttribute("data-filter-group");
          btn.setAttribute("aria-pressed", btn.getAttribute("data-value") === state[group] ? "true" : "false");
        });
        if (status) {
          status.textContent = status.getAttribute("data-template")
            .replace("{n}", shown)
            .replace("{total}", cards.length);
        }
        if (empty) empty.hidden = shown !== 0;
        if (updateUrl && window.history && window.history.replaceState) {
          var q = new URLSearchParams();
          if (state.field !== "all") q.set("field", state.field);
          if (state.type !== "all") q.set("type", state.type);
          var qs = q.toString();
          window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
        }
      };

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          state[btn.getAttribute("data-filter-group")] = btn.getAttribute("data-value");
          apply(true);
        });
      });

      bar.hidden = false;
      apply(false);
    }

    /* ---- 3. Current year in footer ---- */
    var years = document.querySelectorAll("[data-current-year]");
    for (var i = 0; i < years.length; i++) years[i].textContent = new Date().getFullYear();
  });
})();
