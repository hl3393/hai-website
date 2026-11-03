/* =========================================================
   Human Alignment Institute — small helper script
   ---------------------------------------------------------
   1. Opens/closes the menu on small screens.
   2. Fills in the current year in the footer.
   The site still works if JavaScript is turned off.
   ========================================================= */
(function () {
  "use strict";

  // Tell the CSS that JavaScript is running
  document.documentElement.classList.add("js");

  document.addEventListener("DOMContentLoaded", function () {
    // ---- Mobile menu ----
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");

    if (toggle && nav) {
      var closeMenu = function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      };

      toggle.addEventListener("click", function () {
        var isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      // Close the menu with the Escape key
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && nav.classList.contains("is-open")) {
          closeMenu();
          toggle.focus();
        }
      });
    }

    // ---- Current year in footer ----
    var yearEls = document.querySelectorAll("[data-current-year]");
    for (var i = 0; i < yearEls.length; i++) {
      yearEls[i].textContent = new Date().getFullYear();
    }
  });
})();
