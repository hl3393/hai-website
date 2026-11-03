/* =========================================================
   Human Alignment Institute — small helper script
   ---------------------------------------------------------
   1. Opens/closes the menu on small screens.
   2. Filters the Voices page by field, role and type (combinable).
   3. Fills in the current year in the footer.
   4. Theme control (Auto / Light / Dark) and following the sun.
   5. The "today" strip: date, city, weather, sunrise and sunset.
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

    /* ---- 5. Today strip ---- */
    var today = document.querySelector("[data-today]");
    if (today && theme) setupToday(today, theme);

    /* ---- 3. Current year in footer ---- */
    var years = document.querySelectorAll("[data-current-year]");
    for (var i = 0; i < years.length; i++) years[i].textContent = new Date().getFullYear();
  });

  /* ---------------------------------------------------------------
     Today strip helpers
     - Location comes from the time zone (see templates/sun.js); the
       browser is asked for the exact location ONLY when the visitor
       clicks "Use my location".
     - Weather comes from Open-Meteo (free, no key). If anything fails,
       the weather part simply stays hidden.
     --------------------------------------------------------------- */
  var WEATHER = {
    en: { 0: "clear", 1: "mostly clear", 2: "partly cloudy", 3: "cloudy", 45: "fog", 48: "fog",
          51: "drizzle", 53: "drizzle", 55: "drizzle", 56: "freezing drizzle", 57: "freezing drizzle",
          61: "light rain", 63: "rain", 65: "heavy rain", 66: "freezing rain", 67: "freezing rain",
          71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains",
          80: "showers", 81: "showers", 82: "heavy showers", 85: "snow showers", 86: "snow showers",
          95: "thunderstorm", 96: "thunderstorm", 99: "thunderstorm" },
    zh: { 0: "晴", 1: "晴间多云", 2: "局部多云", 3: "阴", 45: "雾", 48: "雾",
          51: "毛毛雨", 53: "毛毛雨", 55: "毛毛雨", 56: "冻毛毛雨", 57: "冻毛毛雨",
          61: "小雨", 63: "中雨", 65: "大雨", 66: "冻雨", 67: "冻雨",
          71: "小雪", 73: "中雪", 75: "大雪", 77: "米雪",
          80: "阵雨", 81: "阵雨", 82: "强阵雨", 85: "阵雪", 86: "阵雪",
          95: "雷暴", 96: "雷暴", 99: "雷暴" }
  };

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

  function setupToday(strip, theme) {
    var lang = document.documentElement.lang === "zh-Hans" ? "zh" : "en";
    var locale = lang === "zh" ? "zh-CN" : "en-US";
    var dateEl = strip.querySelector("[data-today-date]");
    var placeEl = strip.querySelector("[data-today-place]");
    var sunEl = strip.querySelector("[data-today-sun]");
    var termEl = strip.querySelector("[data-today-term]");
    var moonEl = strip.querySelector("[data-today-moon]");
    var locateBtn = strip.querySelector("[data-locate]");
    var requestId = 0;

    function time(d) { return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }); }

    function render() {
      var now = new Date();
      dateEl.textContent = now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });

      // Solar term (二十四节气) and moon phase, both calculated here
      var term = solarTerm(now);
      termEl.textContent = "";
      if (lang === "en") {
        termEl.appendChild(document.createTextNode(SOLAR_TERMS.en[term] + " "));
        var zhTerm = document.createElement("span");
        zhTerm.lang = "zh-Hans";
        zhTerm.textContent = SOLAR_TERMS.zh[term];
        termEl.appendChild(zhTerm);
      } else {
        termEl.textContent = SOLAR_TERMS.zh[term];
      }
      var age = moonAge(now);
      var phase = Math.floor((age / SYNODIC) * 8 + 0.5) % 8;
      moonEl.innerHTML = moonIcon(age / SYNODIC);
      moonEl.appendChild(document.createTextNode(MOON_PHASES[lang][phase]));

      var p = theme.place();
      var s = p ? theme.sun(now, p.lat, p.lon) : null;
      if (s && s.length === 2) {
        sunEl.textContent = strip.getAttribute("data-sunrise") + " " + time(s[0]) + " · " +
          strip.getAttribute("data-sunset") + " " + time(s[1]);
        sunEl.hidden = false;
      } else {
        sunEl.hidden = true;
      }

      if (locateBtn) {
        locateBtn.textContent = locateBtn.getAttribute(p && p.own ? "data-label-on" : "data-label-off");
      }
      showWeather(p, lang);
    }

    function showWeather(p, lang) {
      var id = ++requestId;
      placeEl.hidden = true;
      if (!p || !window.fetch) return;
      var name = p.own ? strip.getAttribute("data-yours") : p[lang];
      var key = "hai-wx:" + p.lat.toFixed(2) + "," + p.lon.toFixed(2);
      var show = function (w) {
        if (id !== requestId || !w || !isFinite(w.temp)) return;
        var text = (WEATHER[lang][w.code] || "");
        placeEl.textContent = name + " · " + Math.round(w.temp) + "°C" + (text ? (lang === "zh" ? " " : " ") + text : "");
        placeEl.hidden = false;
      };
      // Reuse a reading from the last 30 minutes, so each page doesn't ask again
      try {
        var cached = JSON.parse(sessionStorage.getItem(key) || "null");
        if (cached && Date.now() - cached.t < 30 * 60 * 1000) return show(cached);
      } catch (e) {}

      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 6000);
      fetch("https://api.open-meteo.com/v1/forecast?latitude=" + p.lat.toFixed(3) +
            "&longitude=" + p.lon.toFixed(3) + "&current=temperature_2m,weather_code&timezone=auto",
            ctrl ? { signal: ctrl.signal } : undefined)
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) {
          clearTimeout(timer);
          var w = { t: Date.now(), temp: data.current.temperature_2m, code: data.current.weather_code };
          try { sessionStorage.setItem(key, JSON.stringify(w)); } catch (e) {}
          show(w);
        })
        .catch(function () { clearTimeout(timer); /* stay quiet */ });
    }

    if (locateBtn) {
      if (!navigator.geolocation) {
        locateBtn.parentNode.hidden = true;
      } else {
        locateBtn.addEventListener("click", function () {
          var p = theme.place();
          if (p && p.own) {
            // Go back to the time-zone city
            window.haiOwnPlace = null;
            try { localStorage.removeItem("hai-place"); } catch (e) {}
            render();
            if (theme.choice() === "auto") theme.apply();
            return;
          }
          // Only now, because the visitor asked, do we request their location.
          navigator.geolocation.getCurrentPosition(function (pos) {
            var own = { lat: pos.coords.latitude, lon: pos.coords.longitude, own: true };
            try { localStorage.setItem("hai-place", JSON.stringify({ lat: own.lat, lon: own.lon })); }
            catch (e) { window.haiOwnPlace = own; }
            render();
            if (theme.choice() === "auto") theme.apply();
          }, function () { /* declined or unavailable: keep the time-zone city quietly */ },
          { timeout: 10000, maximumAge: 10 * 60 * 1000 });
        });
      }
    }

    render();
    setInterval(render, 5 * 60 * 1000);
  }
})();
