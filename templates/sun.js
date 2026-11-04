/* =====================================================================
   Time-of-day theme — inlined into the <head> of every page by build.js,
   so the right colours are there before the page is drawn.

   Where is the visitor? Only roughly, and without asking: the browser's
   time zone is mapped to a representative city in the table ZONES below.
   That is plenty for colours that change over a 2.5-hour window. If the
   time zone isn't listed, rough sunrise/sunset hours by month are used.

   Sun times use the standard "sunrise equation" (accurate to a few
   minutes), computed locally — nothing is sent anywhere.
   ===================================================================== */
(function () {
  "use strict";

  // Time zone | city (English) | city (中文) | latitude | longitude
  var ZONES =
    "America/New_York|New York|纽约|40.71|-74.01;America/Detroit|Detroit|底特律|42.33|-83.05;" +
    "America/Toronto|Toronto|多伦多|43.65|-79.38;America/Chicago|Chicago|芝加哥|41.88|-87.63;" +
    "America/Indiana/Indianapolis|Indianapolis|印第安纳波利斯|39.77|-86.16;America/Winnipeg|Winnipeg|温尼伯|49.9|-97.14;" +
    "America/Denver|Denver|丹佛|39.74|-104.99;America/Edmonton|Edmonton|埃德蒙顿|53.55|-113.49;" +
    "America/Phoenix|Phoenix|凤凰城|33.45|-112.07;America/Los_Angeles|Los Angeles|洛杉矶|34.05|-118.24;" +
    "America/Vancouver|Vancouver|温哥华|49.28|-123.12;America/Anchorage|Anchorage|安克雷奇|61.22|-149.9;" +
    "Pacific/Honolulu|Honolulu|檀香山|21.31|-157.86;America/Halifax|Halifax|哈利法克斯|44.65|-63.57;" +
    "America/St_Johns|St. John's|圣约翰斯|47.56|-52.71;America/Puerto_Rico|San Juan|圣胡安|18.47|-66.11;" +
    "America/Mexico_City|Mexico City|墨西哥城|19.43|-99.13;America/Havana|Havana|哈瓦那|23.11|-82.37;" +
    "America/Bogota|Bogotá|波哥大|4.71|-74.07;America/Lima|Lima|利马|-12.05|-77.04;" +
    "America/Caracas|Caracas|加拉加斯|10.48|-66.9;America/Santiago|Santiago|圣地亚哥|-33.45|-70.67;" +
    "America/Argentina/Buenos_Aires|Buenos Aires|布宜诺斯艾利斯|-34.6|-58.38;America/Sao_Paulo|São Paulo|圣保罗|-23.55|-46.63;" +
    "Europe/London|London|伦敦|51.51|-0.13;Europe/Dublin|Dublin|都柏林|53.35|-6.26;" +
    "Europe/Lisbon|Lisbon|里斯本|38.72|-9.14;Europe/Madrid|Madrid|马德里|40.42|-3.7;" +
    "Europe/Paris|Paris|巴黎|48.86|2.35;Europe/Brussels|Brussels|布鲁塞尔|50.85|4.35;" +
    "Europe/Amsterdam|Amsterdam|阿姆斯特丹|52.37|4.9;Europe/Berlin|Berlin|柏林|52.52|13.4;" +
    "Europe/Zurich|Zurich|苏黎世|47.38|8.54;Europe/Rome|Rome|罗马|41.9|12.5;" +
    "Europe/Vienna|Vienna|维也纳|48.21|16.37;Europe/Prague|Prague|布拉格|50.08|14.44;" +
    "Europe/Warsaw|Warsaw|华沙|52.23|21.01;Europe/Budapest|Budapest|布达佩斯|47.5|19.04;" +
    "Europe/Copenhagen|Copenhagen|哥本哈根|55.68|12.57;Europe/Stockholm|Stockholm|斯德哥尔摩|59.33|18.07;" +
    "Europe/Oslo|Oslo|奥斯陆|59.91|10.75;Europe/Helsinki|Helsinki|赫尔辛基|60.17|24.94;" +
    "Europe/Athens|Athens|雅典|37.98|23.73;Europe/Bucharest|Bucharest|布加勒斯特|44.43|26.1;" +
    "Europe/Istanbul|Istanbul|伊斯坦布尔|41.01|28.98;Europe/Kyiv|Kyiv|基辅|50.45|30.52;" +
    "Europe/Kiev|Kyiv|基辅|50.45|30.52;Europe/Moscow|Moscow|莫斯科|55.76|37.62;" +
    "Africa/Cairo|Cairo|开罗|30.04|31.24;Africa/Lagos|Lagos|拉各斯|6.52|3.38;" +
    "Africa/Nairobi|Nairobi|内罗毕|-1.29|36.82;Africa/Johannesburg|Johannesburg|约翰内斯堡|-26.2|28.05;" +
    "Asia/Jerusalem|Jerusalem|耶路撒冷|31.77|35.21;Asia/Riyadh|Riyadh|利雅得|24.71|46.68;" +
    "Asia/Dubai|Dubai|迪拜|25.2|55.27;Asia/Tehran|Tehran|德黑兰|35.69|51.39;" +
    "Asia/Karachi|Karachi|卡拉奇|24.86|67.0;Asia/Tashkent|Tashkent|塔什干|41.3|69.24;" +
    "Asia/Kolkata|New Delhi|新德里|28.61|77.21;Asia/Calcutta|New Delhi|新德里|28.61|77.21;" +
    "Asia/Kathmandu|Kathmandu|加德满都|27.72|85.32;Asia/Almaty|Almaty|阿拉木图|43.24|76.89;" +
    "Asia/Dhaka|Dhaka|达卡|23.81|90.41;Asia/Bangkok|Bangkok|曼谷|13.76|100.5;" +
    "Asia/Ho_Chi_Minh|Ho Chi Minh City|胡志明市|10.82|106.63;Asia/Jakarta|Jakarta|雅加达|-6.2|106.85;" +
    "Asia/Kuala_Lumpur|Kuala Lumpur|吉隆坡|3.14|101.69;Asia/Singapore|Singapore|新加坡|1.35|103.82;" +
    "Asia/Manila|Manila|马尼拉|14.6|120.98;Asia/Shanghai|Beijing|北京|39.9|116.4;" +
    "Asia/Chongqing|Chongqing|重庆|29.56|106.55;Asia/Urumqi|Ürümqi|乌鲁木齐|43.83|87.62;" +
    "Asia/Hong_Kong|Hong Kong|香港|22.32|114.17;Asia/Macau|Macau|澳门|22.2|113.54;" +
    "Asia/Taipei|Taipei|台北|25.03|121.57;Asia/Ulaanbaatar|Ulaanbaatar|乌兰巴托|47.89|106.91;" +
    "Asia/Seoul|Seoul|首尔|37.57|126.98;Asia/Tokyo|Tokyo|东京|35.68|139.69;" +
    "Australia/Perth|Perth|珀斯|-31.95|115.86;Australia/Adelaide|Adelaide|阿德莱德|-34.93|138.6;" +
    "Australia/Brisbane|Brisbane|布里斯班|-27.47|153.03;Australia/Sydney|Sydney|悉尼|-33.87|151.21;" +
    "Australia/Melbourne|Melbourne|墨尔本|-37.81|144.96;Pacific/Auckland|Auckland|奥克兰|-36.85|174.76";

  // Fallback when the time zone is unknown: rough [sunrise, sunset] hours by month
  var MONTHLY = [[7.3,17],[7,17.6],[7.1,19],[6.5,19.6],[5.8,20.1],[5.5,20.5],
                 [5.7,20.4],[6.2,19.9],[6.7,19.1],[7.2,18.3],[6.8,16.7],[7.2,16.5]];

  function timeZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return ""; }
  }

  // Where we roughly are: {lat, lon, en, zh} for the time zone's city, or null
  function place() {
    var tz = timeZone(), rows = ZONES.split(";");
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i].split("|");
      if (r[0] === tz) return { lat: +r[3], lon: +r[4], en: r[1], zh: r[2] };
    }
    return null;
  }

  // Sunrise and sunset for the local calendar day of `date`.
  // Returns [riseDate, setDate], or "day" / "night" during polar day / night.
  function sun(date, lat, lon) {
    var rad = Math.PI / 180;
    var noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    var n = Math.round(noon.getTime() / 864e5 + 2440587.5 - 2451545);
    var j = n - lon / 360;
    var m = (357.5291 + 0.98560028 * j) % 360;
    var c = 1.9148 * Math.sin(m * rad) + 0.02 * Math.sin(2 * m * rad) + 0.0003 * Math.sin(3 * m * rad);
    var l = (m + c + 282.9372) % 360;
    var transit = 2451545 + j + 0.0053 * Math.sin(m * rad) - 0.0069 * Math.sin(2 * l * rad);
    var dec = Math.asin(Math.sin(l * rad) * Math.sin(23.4397 * rad));
    var cosW = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
    if (cosW < -1) return "day";
    if (cosW > 1) return "night";
    var w = Math.acos(cosW) / rad / 360;
    var toDate = function (jd) { return new Date((jd - 2440587.5) * 864e5); };
    return [toDate(transit - w), toDate(transit + w)];
  }

  function hours(d) { return d.getHours() + d.getMinutes() / 60; }

  // sunrise: 1 h before → 1.5 h after sunrise; sunset: 1.5 h before → 1 h after sunset
  function sunTheme(now) {
    var p = place(), s = p ? sun(now, p.lat, p.lon) : null, rise, set;
    if (s === "day" || s === "night") return s;
    if (s) { rise = hours(s[0]); set = hours(s[1]); }
    else { rise = MONTHLY[now.getMonth()][0]; set = MONTHLY[now.getMonth()][1]; }
    var h = hours(now);
    if (h >= rise - 1 && h < rise + 1.5) return "sunrise";
    if (h >= rise + 1.5 && h < set - 1.5) return "day";
    if (h >= set - 1.5 && h < set + 1) return "sunset";
    return "night";
  }

  // The visitor's Appearance choice: "auto" (default), "light" or "dark"
  function choice() {
    try { var c = localStorage.getItem("hai-theme"); if (c === "light" || c === "dark") return c; } catch (e) {}
    return "auto";
  }

  function resolve() {
    var c = choice();
    if (c === "light") return "day";
    if (c === "dark") return "night";
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "night";
    return sunTheme(new Date());
  }

  function apply() { document.documentElement.setAttribute("data-theme", resolve()); }

  // An earlier version could remember a visitor's exact location; forget it.
  try { localStorage.removeItem("hai-place"); } catch (e) {}

  document.documentElement.className += " js";

  // Gentle motion (page unfolding, reveals) — only if the visitor hasn't
  // asked for reduced motion. Content starts hidden from the first paint, so
  // nothing flashes; main.js then reveals it. A safety timer shows
  // everything anyway if main.js never runs.
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.className += " motion" + ("onpagereveal" in window ? "" : " no-vt");
    window.haiMotionFailsafe = setTimeout(function () {
      document.documentElement.classList.remove("motion");
    }, 2500);
  }
  apply();
  window.haiTheme = { apply: apply, choice: choice, place: place, sun: sun };
})();
