/* =========================================================
   Human Alignment Institute — small helper script
   ---------------------------------------------------------
   1. Opens/closes the menu on small screens.
   2. Filters the Voices page by field, role and type (combinable).
   3. Fills in the current year in the footer.
   4. Theme control (Auto / Light / Dark) and following the sun.
   5. The top bar: date, solar term, moon phase, sunrise and sunset.
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
      var groups = ["field", "role", "type"];
      var state = { field: "all", role: "all", type: "all" };

      // Allow links such as voices.html?field=arts&role=learner&type=video
      var params = new URLSearchParams(window.location.search);
      groups.forEach(function (group) {
        var value = params.get(group);
        if (value && bar.querySelector('[data-filter-group="' + group + '"][data-value="' + value + '"]')) {
          state[group] = value;
        }
      });

      var apply = function (updateUrl) {
        var shown = 0;
        cards.forEach(function (card) {
          // A card can have several fields (space-separated), one role and one type.
          // It is shown only if it matches every chosen filter.
          var ok = groups.every(function (g) {
            if (state[g] === "all") return true;
            var values = (card.getAttribute("data-" + g) || "").split(" ");
            return values.indexOf(state[g]) !== -1;
          });
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
          groups.forEach(function (g) {
            if (state[g] !== "all") q.set(g, state[g]);
          });
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
      if (state.field !== "all" || state.role !== "all" || state.type !== "all") bar.open = true;
      apply(false);
    }

    /* ---- 4. Theme: Auto (follows the sun) / Light / Dark ---- */
    var theme = window.haiTheme;
    var themeButtons = Array.prototype.slice.call(document.querySelectorAll("[data-theme-choice]"));
    if (theme) {
      var showChoice = function () {
        var c = theme.choice();
        themeButtons.forEach(function (b) {
          b.setAttribute("aria-pressed", b.getAttribute("data-theme-choice") === c ? "true" : "false");
        });
      };
      themeButtons.forEach(function (b) {
        b.addEventListener("click", function () {
          var c = b.getAttribute("data-theme-choice");
          try {
            if (c === "auto") localStorage.removeItem("hai-theme");
            else localStorage.setItem("hai-theme", c);
          } catch (e) { /* storage blocked: the choice lasts for this page only */ }
          if (c === "auto") theme.apply();
          else document.documentElement.setAttribute("data-theme", c === "dark" ? "night" : "day");
          showChoice();
        });
      });
      showChoice();
      // Keep following the sun while the page stays open, and react to
      // the system switching dark mode on or off.
      setInterval(function () { if (theme.choice() === "auto") theme.apply(); }, 5 * 60 * 1000);
      if (window.matchMedia) {
        var mq = window.matchMedia("(prefers-color-scheme: dark)");
        var onChange = function () { if (theme.choice() === "auto") theme.apply(); };
        if (mq.addEventListener) mq.addEventListener("change", onChange);
        else if (mq.addListener) mq.addListener(onChange);
      }
      // Turn on the fade only after the first paint, so loading never animates.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          document.documentElement.classList.add("theme-ready");
        });
      });
    }

    /* ---- 6. Gentle reveal of the page's blocks ---- */
    setupReveal();

    /* ---- 5. Today strip ---- */
    var today = document.querySelector("[data-today]");
    if (today && theme) setupToday(today, theme);
    setupDisclosures();

    /* ---- 3. Current year in footer ---- */
    var years = document.querySelectorAll("[data-current-year]");
    for (var i = 0; i < years.length; i++) years[i].textContent = new Date().getFullYear();
  });

  /* ---- Sky calculations (no network) ---- */
  // The 24 solar terms, starting at the Spring Equinox (sun at 0°); one every 15°
  var SOLAR_TERMS = {
    en: ["Spring Equinox", "Clear and Bright", "Grain Rain", "Start of Summer", "Grain Buds", "Grain in Ear",
         "Summer Solstice", "Minor Heat", "Major Heat", "Start of Autumn", "End of Heat", "White Dew",
         "Autumn Equinox", "Cold Dew", "Frost’s Descent", "Start of Winter", "Minor Snow", "Major Snow",
         "Winter Solstice", "Minor Cold", "Major Cold", "Start of Spring", "Rain Water", "Awakening of Insects"],
    zh: ["春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露",
         "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至", "小寒", "大寒", "立春", "雨水", "惊蛰"]
  };
  var MOON_PHASES = {
    en: ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous",
         "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"],
    zh: ["新月", "蛾眉月", "上弦月", "盈凸月", "满月", "亏凸月", "下弦月", "残月"]
  };
  var SYNODIC = 29.530588853; // days from one new moon to the next

  function julian(d) { return d.getTime() / 864e5 + 2440587.5; }

  // The sun's position along the ecliptic (Astronomical Almanac, accurate to ~0.01°)
  function solarTerm(d) {
    var rad = Math.PI / 180, n = julian(d) - 2451545;
    var g = (357.528 + 0.9856003 * n) * rad;
    var lambda = (280.460 + 0.9856474 * n + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360;
    if (lambda < 0) lambda += 360;
    return Math.floor(lambda / 15);
  }

  // Days since the last new moon (reference new moon: 6 January 2000)
  function moonAge(d) {
    var a = (julian(d) - 2451550.1) % SYNODIC;
    return a < 0 ? a + SYNODIC : a;
  }

  // A small geometric moon: a faint ring, with the lit part filled in.
  // p = 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter.
  function moonIcon(p) {
    var c = 8, r = 6.5;
    var rx = Math.abs(Math.cos(2 * Math.PI * p)) * r;
    var crescent = p < 0.25 || p > 0.75;
    var lit;
    if (p <= 0.5) { // waxing: lit on the right
      lit = "M" + c + " " + (c - r) + "A" + r + " " + r + " 0 0 1 " + c + " " + (c + r) +
            "A" + rx.toFixed(2) + " " + r + " 0 0 " + (crescent ? 0 : 1) + " " + c + " " + (c - r) + "Z";
    } else {        // waning: lit on the left
      lit = "M" + c + " " + (c - r) + "A" + r + " " + r + " 0 0 0 " + c + " " + (c + r) +
            "A" + rx.toFixed(2) + " " + r + " 0 0 " + (crescent ? 1 : 0) + " " + c + " " + (c - r) + "Z";
    }
    return '<svg class="moon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
      '<circle class="moon-disc" cx="8" cy="8" r="6.5"/><path class="moon-lit" d="' + lit + '"/></svg>';
  }

  /* ---- Today in the top bar ----
     Date, solar term, moon phase and sunrise/sunset — all calculated here
     in the browser. Nothing is sent anywhere and no permission is asked:
     sun times use the visitor's time zone (see templates/sun.js). */
  function setupToday(strip, theme) {
    var lang = document.documentElement.lang === "zh-Hans" ? "zh" : "en";
    var locale = lang === "zh" ? "zh-CN" : "en-US";
    var dateEl = strip.querySelector("[data-today-date]");
    var sunEl = strip.querySelector("[data-today-sun]");
    // The solar term and moon name appear twice: in the bar (wide screens)
    // and inside the "Today" panel (narrow screens).
    var termEls = Array.prototype.slice.call(strip.querySelectorAll("[data-today-term]"));
    var moonIconEl = strip.querySelector("[data-today-moon-icon]");
    var moonNameEls = Array.prototype.slice.call(strip.querySelectorAll("[data-today-moon-name]"));

    function time(d) { return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }); }

    function render() {
      var now = new Date();
      dateEl.textContent = now.toLocaleDateString(locale, lang === "zh"
        ? { weekday: "long", month: "long", day: "numeric" }
        : { weekday: "short", month: "short", day: "numeric" });

      var term = solarTerm(now);
      termEls.forEach(function (el) {
        el.textContent = "";
        if (lang === "en") {
          el.appendChild(document.createTextNode(SOLAR_TERMS.en[term] + " "));
          var zhTerm = document.createElement("span");
          zhTerm.lang = "zh-Hans";
          zhTerm.textContent = SOLAR_TERMS.zh[term];
          el.appendChild(zhTerm);
        } else {
          el.textContent = SOLAR_TERMS.zh[term];
        }
      });
      var age = moonAge(now);
      var phase = Math.floor((age / SYNODIC) * 8 + 0.5) % 8;
      moonIconEl.innerHTML = moonIcon(age / SYNODIC);
      moonIconEl.setAttribute("title", MOON_PHASES[lang][phase]);
      moonNameEls.forEach(function (el) { el.textContent = MOON_PHASES[lang][phase]; });

      var p = theme.place();
      var s = p ? theme.sun(now, p.lat, p.lon) : null;
      if (s && s.length === 2) {
        sunEl.textContent = strip.getAttribute("data-sunrise") + " " + time(s[0]) + " · " +
          strip.getAttribute("data-sunset") + " " + time(s[1]);
        sunEl.hidden = false;
      } else {
        sunEl.hidden = true;
      }
    }

    render();
    fitTopbar();
    setInterval(render, 5 * 60 * 1000);
    var resizeTimer;
    window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitTopbar, 100); });
  }

  /* Show the full top bar only when everything fits on one line;
     otherwise keep the compact layout (date · moon · Today · theme). */
  function fitTopbar() {
    var bar = document.querySelector(".topbar");
    if (!bar) return;
    var inner = bar.querySelector(".topbar-inner");
    var left = bar.querySelector(".topbar-left"), right = bar.querySelector(".topbar-right");
    // Measure the full row at its natural, single-line width
    bar.classList.remove("is-compact");
    bar.classList.add("tb-measure");
    var style = getComputedStyle(inner);
    var room = inner.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    var needed = left.getBoundingClientRect().width + right.getBoundingClientRect().width + 16;
    bar.classList.remove("tb-measure");
    if (needed > room) bar.classList.add("is-compact");
  }


  /* ---- Staggered reveal ----
     Blocks already on screen unfold one after another (70ms apart, never
     more than ~0.35s in total). Blocks further down rise in once as they
     scroll into view. Only runs when <html> has the "motion" class
     (set in <head>; never with reduced motion). */
  function setupReveal() {
    var root = document.documentElement;
    if (!root.classList.contains("motion")) return;
    clearTimeout(window.haiMotionFailsafe);
    var STEP = 70, MAX = 350;
    var items = Array.prototype.slice.call(document.querySelectorAll(
      "main > section, main > article > *, .voice-grid > .voice-card, .grid > .card, .contributor-list > .contributor"));
    var show = function (el, delay) {
      el.style.setProperty("--rv-delay", delay + "ms");
      el.classList.add("is-in");
      // Afterwards, hand back the element's own transitions (hover, press)
      setTimeout(function () { el.classList.add("rv-done"); el.style.removeProperty("--rv-delay"); }, delay + 600);
    };
    var viewH = window.innerHeight, first = 0;
    var observer = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        observer.unobserve(e.target);
        show(e.target, Math.min(batch++ * STEP, 210));
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (el.hidden || r.height === 0) { el.classList.add("is-in", "rv-done"); return; }
      if (r.top < viewH) show(el, Math.min(first++ * STEP, MAX)); // on screen now: unfold in order
      else observer.observe(el);                                   // further down: on scroll
    });
  }

  /* ---- Narrow screens: the "Today" panel and the theme menu ----
     Each small button opens its panel; Escape or a click elsewhere closes it. */
  function setupDisclosures() {
    var pairs = [];
    Array.prototype.slice.call(document.querySelectorAll(".tb-toggle")).forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      var close = function (focusBack) {
        panel.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        if (focusBack) btn.focus();
      };
      btn.addEventListener("click", function () {
        var open = !panel.classList.contains("is-open");
        pairs.forEach(function (p) { if (p.btn !== btn) p.close(false); });
        panel.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      pairs.push({ btn: btn, panel: panel, close: close });
    });
    document.addEventListener("click", function (e) {
      pairs.forEach(function (p) {
        if (!p.panel.contains(e.target) && !p.btn.contains(e.target)) p.close(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      pairs.forEach(function (p) { if (p.panel.classList.contains("is-open")) p.close(true); });
    });
    // Choosing an appearance closes the theme menu
    Array.prototype.slice.call(document.querySelectorAll("#theme-menu .theme-btn")).forEach(function (b) {
      b.addEventListener("click", function () {
        pairs.forEach(function (p) { if (p.panel.id === "theme-menu" && p.panel.classList.contains("is-open")) p.close(true); });
      });
    });
  }
})();
