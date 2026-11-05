#!/usr/bin/env node
/* =====================================================================
   Human Alignment Institute — site builder
   ---------------------------------------------------------------------
   You normally never need to edit this file.

   What it does (run with:  npm run build):
     1. Reads every piece in content/voices/*.md
     2. Reads every author in content/contributors/*.md
     3. Reads the page texts in pages/en/*.html and pages/zh/*.html
     4. Wraps everything in templates/layout.html
     5. Writes the finished website into the folder  public/
        (Cloudflare Pages publishes that folder.)

   Settings such as field names, menu labels and the contact email
   live in site.json.
   ===================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const ROOT_DIR = __dirname;
const OUT = path.join(ROOT_DIR, "public");
const LANGS = ["en", "zh"];
const NAV_ORDER = ["index", "voices", "contributors", "thaap", "about"];

const site = JSON.parse(read("site.json"));
const errors = [];
const warnings = [];

/* ------------------------------------------------------------ helpers */

function read(rel) {
  return fs.readFileSync(path.join(ROOT_DIR, rel), "utf8");
}

function write(rel, text) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/* Reads the "header" between the two --- lines at the top of a file. */
function parseFrontMatter(raw, fileLabel) {
  const text = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    errors.push(`${fileLabel}: the file must start with a header between two lines of ---`);
    return { data: {}, body: text };
  }
  const data = {};
  match[1].split("\n").forEach((line, i) => {
    if (!line.trim() || line.trim().startsWith("#")) return;
    const m = line.match(/^\s*([A-Za-z_]+)\s*:\s*(.*)$/);
    if (!m) {
      errors.push(`${fileLabel}: header line ${i + 2} is not in the form "name: value" → ${line}`);
      return;
    }
    let value = m[2].trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    data[m[1].toLowerCase()] = value;
  });
  return { data, body: match[2] };
}

function listMarkdown(dir) {
  const full = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();
}

function isTrue(v) {
  return /^(true|yes|1)$/i.test(String(v || "").trim());
}

function formatDate(iso, lang) {
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(site.ui[lang].dateFormat, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function label(group, key, lang) {
  const entry = site[group][key];
  return entry ? entry[lang] || entry.en : key;
}

/* Turns a YouTube / Vimeo / Bilibili address into an embeddable player. */
function videoEmbed(url) {
  if (!url) return null;
  let b = url.match(/bilibili\.com\/video\/(BV[0-9A-Za-z]{10})/);
  if (b) return { src: `https://player.bilibili.com/player.html?bvid=${b[1]}&autoplay=0&danmaku=0&high_quality=1`, host: "Bilibili" };
  b = url.match(/bilibili\.com\/video\/av(\d+)/i);
  if (b) return { src: `https://player.bilibili.com/player.html?aid=${b[1]}&autoplay=0&danmaku=0&high_quality=1`, host: "Bilibili" };
  let m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
  );
  if (m) return { src: `https://www.youtube-nocookie.com/embed/${m[1]}`, host: "YouTube" };
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { src: `https://player.vimeo.com/video/${m[1]}?dnt=1`, host: "Vimeo" };
  return { src: null, host: null };
}

/* Creative Commons licences that can be named in a piece's header */
const LICENSES = {
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "CC BY-ND 4.0": "https://creativecommons.org/licenses/by-nd/4.0/",
  "CC BY-NC 4.0": "https://creativecommons.org/licenses/by-nc/4.0/",
  "CC BY-NC-SA 4.0": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  "CC BY-NC-ND 4.0": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
};

/* Fills {name} placeholders in a sentence from site.json */
function fill(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (all, k) => (k in values ? values[k] : all));
}

/* Reads "field: education, arts" into ["education", "arts"] and checks
   every value against the list in site.json. */
function parseFields(value, fileLabel) {
  const list = String(value || "")
    .split(/[,，、]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  list.forEach((f) => {
    if (!site.fields[f])
      errors.push(
        `${fileLabel}: field "${f}" is unknown. Use one or more of: ${Object.keys(site.fields).join(", ")} (separated by commas)`
      );
  });
  return [...new Set(list)];
}

/* Reads "role: practitioner" and checks it against site.json. */
function parseRole(value, fileLabel) {
  const role = String(value || "").trim().toLowerCase();
  if (!role) return "";
  if (/[,，、]/.test(role)) {
    errors.push(`${fileLabel}: role must be just ONE of: ${Object.keys(site.roles).join(", ")}`);
    return "";
  }
  if (!site.roles[role]) {
    errors.push(`${fileLabel}: role "${role}" is unknown. Use one of: ${Object.keys(site.roles).join(", ")}`);
    return "";
  }
  return role;
}

/* --------------------------------------------------------- contributors */

const contributors = {};
for (const file of listMarkdown("content/contributors")) {
  const label_ = `content/contributors/${file}`;
  const { data, body } = parseFrontMatter(read(label_), label_);
  const slug = file.replace(/\.md$/, "");
  if (!data.name) errors.push(`${label_}: missing "name:"`);
  contributors[slug] = {
    slug,
    name: data.name || slug,
    name_zh: data.name_zh || "",
    fields: parseFields(data.field, label_),
    role: parseRole(data.role, label_),
    photo: data.photo || "placeholder.svg",
    bio: data.bio || stripTags(marked.parse(body || "")),
    bio_zh: data.bio_zh || "",
    order: Number(data.order || 100),
    sample: isTrue(data.sample),
    pieces: [],
  };
}

function findContributor(value) {
  if (!value) return null;
  const v = value.trim();
  if (contributors[v]) return contributors[v];
  const lower = v.toLowerCase();
  return (
    Object.values(contributors).find(
      (c) => c.name.toLowerCase() === lower || (c.name_zh && c.name_zh === v)
    ) || null
  );
}

function contributorName(c, lang) {
  return lang === "zh" && c.name_zh ? c.name_zh : c.name;
}

function contributorBio(c, lang) {
  if (lang === "zh" && c.bio_zh) return { text: c.bio_zh, lang: "zh" };
  return { text: c.bio, lang: "en" };
}

/* --------------------------------------------------------------- voices */

const voices = [];
for (const file of listMarkdown("content/voices")) {
  const label_ = `content/voices/${file}`;
  const { data, body } = parseFrontMatter(read(label_), label_);
  if (isTrue(data.draft)) continue;

  const slug = file.replace(/\.md$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  for (const key of ["title", "author", "date", "field", "type", "language"]) {
    if (!data[key]) errors.push(`${label_}: missing "${key}:" in the header`);
  }
  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date))
    errors.push(`${label_}: date must look like 2026-03-15 (year-month-day)`);
  const fields = parseFields(data.field, label_);
  let role = parseRole(data.role, label_);
  if (data.type && !site.types[data.type])
    errors.push(
      `${label_}: type "${data.type}" is unknown. Use one of: ${Object.keys(site.types).join(", ")}`
    );
  if (data.language && !site.languages[data.language])
    errors.push(`${label_}: language must be "en" or "zh"`);

  const author = findContributor(data.author);
  if (data.author && !author)
    errors.push(
      `${label_}: author "${data.author}" has no matching file in content/contributors/ ` +
        `(use the contributor's file name without .md, e.g. "author: jane-doe")`
    );
  // If the piece has no "role:", use the role from the author's profile.
  if (!data.role && author && author.role) role = author.role;
  if (!role && !data.role)
    errors.push(
      `${label_}: missing "role:" (${Object.keys(site.roles).join(", ")}). ` +
        `Add it to this piece or to the author's profile.`
    );

  let video = null, videoCn = null;
  if (data.type === "video") {
    video = videoEmbed(data.video);
    if (data.video && !video.src)
      warnings.push(`${label_}: could not recognise the video link (YouTube, Vimeo or Bilibili expected).`);
    videoCn = videoEmbed(data.video_cn);
    if (data.video_cn && !videoCn.src)
      warnings.push(`${label_}: could not recognise the video_cn link (a Bilibili link is expected).`);
  }
  if (data.series && !(site.series || {})[data.series])
    errors.push(
      `${label_}: series "${data.series}" is not listed under "series" in site.json` +
        (Object.keys(site.series || {}).length ? ` (known: ${Object.keys(site.series).join(", ")})` : "")
    );
  if (data.license && !LICENSES[data.license])
    warnings.push(`${label_}: licence "${data.license}" is shown as plain text (known: ${Object.keys(LICENSES).join(", ")}).`);

  const html = marked.parse(body || "");
  const piece = {
    slug,
    file: label_,
    title: data.title || slug,
    author,
    date: data.date || "",
    fields,
    role,
    type: data.type,
    language: data.language || "en",
    summary: data.summary || truncate(stripTags(html), 160),
    videoUrl: data.video || "",
    video,
    videoCnUrl: data.video_cn || "",
    videoCn,
    translationSlug: (data.translation || "").replace(/\.md$/, "").toLowerCase(),
    translation: null,
    editorNote: data.editor_note || "",
    editorNoteZh: data.editor_note_zh || "",
    series: data.series || "",
    license: data.license || "",
    rights: data.rights || "",
    sample: isTrue(data.sample),
    featured: isTrue(data.featured),
    html,
  };
  voices.push(piece);
  if (author) author.pieces.push(piece);
}

voices.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

// Translations: "translation: other-file" links two versions of one piece.
// Only one side needs the line; the link is made in both directions.
for (const piece of voices) {
  if (!piece.translationSlug) continue;
  const other = voices.find((v) => v.slug === piece.translationSlug);
  if (!other) {
    errors.push(`${piece.file}: translation "${piece.translationSlug}" has no matching file in content/voices/`);
    continue;
  }
  if (other.language === piece.language) {
    errors.push(`${piece.file}: its translation "${other.slug}" is in the same language (${piece.language})`);
    continue;
  }
  piece.translation = other;
  if (!other.translation) other.translation = piece;
}

/* The pieces to list on the English or Chinese site: when a piece exists in
   both languages, each site lists only the version in its own language. */
function listedFor(lang, list) {
  return (list || voices).filter((p) => !(p.language !== lang && p.translation && p.translation.language === lang));
}

if (errors.length) {
  console.error("\n✗ The site was NOT built. Please fix these problems:\n");
  errors.forEach((e) => console.error("  • " + e));
  console.error("");
  process.exit(1);
}

/* ------------------------------------------------------ html fragments */

/* ROOT = path back to the top of the site from the current page.
   prefix(lang) = "zh/" for Chinese pages, "" for English pages. */
function prefix(lang) {
  return lang === "zh" ? "zh/" : "";
}

function pageUrl(lang, rel) {
  const clean = rel.replace(/index\.html$/, "").replace(/\.html$/, "");
  return `${site.domain}/${prefix(lang)}${clean}`;
}

/* ---- Field marks: a small Bauhaus-style shape per field ----
   Each field in site.json has a "shape" (circle, triangle, square,
   half-circle, bar) and a "color". */
const SHAPES = {
  // Five Elements (五行): wood, fire, earth, metal, water
  "tall-rectangle": '<rect x="3.5" y="0.5" width="5" height="11"/>',
  triangle: '<path d="M6 1 11 10.5H1Z"/>',
  square: '<rect x="1.5" y="1.5" width="9" height="9"/>',
  circle: '<circle cx="6" cy="6" r="5"/>',
  wave: '<path d="M.5 4.6C2.2 2.6 4 2.6 6 4.6s3.8 2 5.5 0v3.3c-1.7 2-3.5 2-5.5 0s-3.8-2-5.5 0Z"/>',
  // also available
  "half-circle": '<path d="M1 9a5 5 0 0 1 10 0Z"/>',
  bar: '<rect x="0.5" y="4" width="11" height="4"/>',
};

function fieldMark(field, extraClass) {
  const shape = SHAPES[(site.fields[field] || {}).shape] || SHAPES.circle;
  return `<svg class="mark mark--${field}${extraClass ? " " + extraClass : ""}" viewBox="0 0 12 12" aria-hidden="true" focusable="false">${shape}</svg>`;
}

function fieldTag(field, lang, href) {
  const inner = `${fieldMark(field)}${esc(label("fields", field, lang))}`;
  const cls = `tag tag--field tag--f-${field}`;
  return href ? `<a class="${cls}" href="${href}">${inner}</a>` : `<span class="${cls}">${inner}</span>`;
}

function tags(piece, lang, root, linkTags) {
  const href = (k, v) => `${root}${prefix(lang)}voices.html?${k}=${v}`;
  const t = (cls, text, k, v) =>
    linkTags
      ? `<a class="tag ${cls}" href="${href(k, v)}">${esc(text)}</a>`
      : `<span class="tag ${cls}">${esc(text)}</span>`;
  let out = t(`tag--type tag--${piece.type}`, label("types", piece.type, lang), "type", piece.type);
  if (piece.role) out += " " + t("tag--role", label("roles", piece.role, lang), "role", piece.role);
  piece.fields.forEach((f) => {
    out += " " + fieldTag(f, lang, linkTags ? href("field", f) : null);
  });
  if (piece.translation) {
    const otherLang = piece.translation.language;
    out += ` <span class="tag tag--lang">${esc(fill(site.ui[lang].alsoIn, { lang: label("languages", otherLang === lang ? piece.language : otherLang, lang) }))}</span>`;
  } else if (piece.language !== lang) {
    out += ` <span class="tag tag--lang">${esc(label("languages", piece.language, lang))}</span>`;
  }
  if (piece.sample) out += ` <span class="tag tag--sample">${esc(site.ui[lang].sample)}</span>`;
  return out;
}

function voiceCard(piece, lang, root) {
  const ui = site.ui[lang];
  const href = `${root}${prefix(lang)}pieces/${piece.slug}.html`;
  const name = piece.author ? esc(contributorName(piece.author, lang)) : "";
  return `
      <article class="voice-card voice-card--${piece.type}${piece.fields[0] ? ` voice-card--f-${piece.fields[0]}` : ""}" data-field="${piece.fields.join(" ")}" data-role="${piece.role}" data-type="${piece.type}" data-series="${piece.series}">
        ${piece.fields[0] ? fieldMark(piece.fields[0], "card-mark") : ""}
        <p class="voice-tags">${tags(piece, lang, root, false)}</p>
        <h3 lang="${piece.language === "zh" ? "zh-Hans" : "en"}"><a href="${href}">${esc(piece.title)}</a></h3>
        <p class="voice-summary" lang="${piece.language === "zh" ? "zh-Hans" : "en"}">${esc(piece.summary)}</p>
        <p class="voice-byline">${name ? `${ui.by}${name} · ` : ""}<time datetime="${piece.date}">${formatDate(piece.date, lang)}</time></p>
      </article>`;
}

function voiceGrid(list, lang, root, extraAttr) {
  if (!list.length) return `<p>${esc(site.ui[lang].noPieces)}</p>`;
  return `<div class="voice-grid"${extraAttr || ""}>${list.map((p) => voiceCard(p, lang, root)).join("")}
    </div>`;
}

function filterBar(lang) {
  const ui = site.ui[lang];
  const group = (key, title, entries) => `
      <div class="filter-group" role="group" aria-labelledby="filter-${key}-label">
        <span class="filter-label" id="filter-${key}-label">${esc(title)}</span>
        <button type="button" class="filter-btn" data-filter-group="${key}" data-value="all" aria-pressed="true">${esc(ui.all)}</button>
        ${entries
          .map(
            ([value, names]) =>
              `<button type="button" class="filter-btn${key === "field" ? ` filter-btn--field tag--f-${value}` : ""}" data-filter-group="${key}" data-value="${value}" aria-pressed="false">${key === "field" ? fieldMark(value) : ""}${esc(names[lang] || names.en)}</button>`
          )
          .join("\n        ")}
      </div>`;
  // Folded away behind one "Filter" control; opens by itself when a link
  // already contains filters (e.g. voices.html?field=arts).
  return `
    <details class="filters" data-filters hidden>
      <summary class="filters-summary">
        <span class="filters-summary-label">${esc(ui.filterToggle)}</span>
        <span class="filter-status" aria-live="polite" data-filter-status data-template="${esc(ui.showing)}"></span>
      </summary>
      <div class="filters-body">
      ${group("field", ui.filterField, Object.entries(site.fields))}
      ${group("role", ui.filterRole, Object.entries(site.roles))}
      ${group("type", ui.filterType, Object.entries(site.types))}
      </div>
    </details>`;
}

/* "Series: …  ×" — shown on the Voices page when a link asks for one series
   (voices.html?series=key). main.js reveals the matching chip. */
function seriesChips(lang) {
  const entries = Object.entries(site.series || {});
  if (!entries.length) return "";
  return entries
    .map(([key, s]) => `<p class="series-chip" data-series-chip="${key}" hidden><span>${esc(site.ui[lang].seriesLabel)}: <strong>${esc(s[lang] || s.en)}</strong></span> <a href="voices.html" class="series-clear">${esc(site.ui[lang].showAll)}</a></p>`)
    .join("\n    ");
}

function allVoices(lang, root) {
  const ui = site.ui[lang];
  return `${filterBar(lang)}
    ${seriesChips(lang)}
    ${voiceGrid(listedFor(lang), lang, root, " data-filter-list")}
    <p class="filter-empty" data-filter-empty hidden>${esc(ui.empty)}</p>`;
}

function latestVoices(lang, root) {
  const listed = listedFor(lang);
  const featured = listed.filter((v) => v.featured);
  const list = (featured.length ? featured : listed).slice(0, 3);
  return voiceGrid(list, lang, root);
}

function avatar(c, root, size) {
  return `<img class="avatar" src="${root}assets/images/contributors/${esc(c.photo)}" alt="" width="${size}" height="${size}" loading="lazy">`;
}

function contributorsList(lang, root) {
  const ui = site.ui[lang];
  const list = Object.values(contributors).sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name)
  );
  if (!list.length) return "";
  return `<div class="contributor-list">${list
    .map((c) => {
      const bio = contributorBio(c, lang);
      const own = listedFor(lang, c.pieces);
      const pieces = own.length
        ? `<ul class="piece-list">${own
            .map(
              (p) =>
                `<li><a href="${root}${prefix(lang)}pieces/${p.slug}.html" lang="${p.language === "zh" ? "zh-Hans" : "en"}">${esc(p.title)}</a> <span class="piece-list-meta">${esc(label("types", p.type, lang))} · <time datetime="${p.date}">${formatDate(p.date, lang)}</time></span></li>`
            )
            .join("")}</ul>`
        : `<p class="muted">${esc(ui.noPieces)}</p>`;
      return `
      <article class="contributor" id="${c.slug}">
        ${avatar(c, root, 112)}
        <div class="contributor-body">
          <h2>${esc(contributorName(c, lang))}${c.sample ? ` <span class="tag tag--sample">${esc(site.ui[lang].sample)}</span>` : ""}</h2>
          ${
            c.role || c.fields.length
              ? `<p class="voice-tags contributor-tags">${c.role ? `<span class="tag tag--role">${esc(label("roles", c.role, lang))}</span> ` : ""}${c.fields
                  .map((f) => fieldTag(f, lang, `${root}${prefix(lang)}voices.html?field=${f}`))
                  .join(" ")}</p>`
              : ""
          }
          <p lang="${bio.lang === "zh" ? "zh-Hans" : "en"}">${esc(bio.text)}</p>
          <h3>${esc(ui.piecesBy)}</h3>
          ${pieces}
        </div>
      </article>`;
    })
    .join("")}
    </div>`;
}

/* ------------------------------------------------------------- layout */

const layout = read("templates/layout.html");
const sunScript = read("templates/sun.js").trim();

/* The logo is inlined into each page (not an <img>), so the night theme can
   recolour it: every colour in the SVG becomes a CSS variable named after
   it, e.g. #2F4A6D -> var(--logo-2f4a6d, #2F4A6D). See style.css. */
function inlineLogo(cls, label) {
  if (!site.brand.logo) return "";
  let svg = fs.readFileSync(path.join(ROOT_DIR, "static/assets/images", site.brand.logo), "utf8").trim();
  if (!/^<svg[\s>]/.test(svg)) return `<img class="${cls}" src="assets/images/${esc(site.brand.logo)}" alt="">`;
  svg = svg
    .replace(/\s(fill|stroke)="(#[0-9a-fA-F]{6})"/g, (all, prop, hex) => ` style="${prop}: var(--logo-${hex.slice(1).toLowerCase()}, ${hex})"`)
    .replace(/^<svg\b/, `<svg class="${cls}"${label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true"'} focusable="false"`)
    .replace(/\s*\n\s*/g, "");
  return svg;
}

function shareImage(lang) { return lang === "zh" ? "share-zh.png" : "share-en.png"; }

function organization() {
  return {
    "@type": "Organization",
    name: site.brand.wordmark.en,
    alternateName: site.brand.wordmark.zh,
    url: site.domain + "/",
    email: site.email,
    logo: `${site.domain}/assets/images/favicon-512.png`,
  };
}

function render({ lang, rel, depth, title, description, navKey, content, ogType, switchRel, rootOverride, jsonld }) {
  const ui = site.ui[lang];
  const other = lang === "en" ? "zh" : "en";
  const root = rootOverride || "../".repeat(depth);
  // The header menu leaves out "Home" (the logo goes home); the footer lists everything.
  const navLinks = (indent, withCurrent) =>
    NAV_ORDER.filter((key) => !withCurrent || key !== "index").map((key) => {
      let cur = "";
      if (withCurrent && key === navKey) cur = rel === `${key}.html` ? ' aria-current="page"' : ' aria-current="true"';
      return `${indent}<li><a href="${root}${prefix(lang)}${key}.html"${cur}>${esc(ui.nav[key])}</a></li>`;
    }).join("\n");

  const values = {
    HTML_LANG: ui.htmlLang,
    FULL_TITLE: esc(rel === "index.html" ? `${ui.siteName} — ${title}` : `${title} | ${ui.siteName}`),
    DESCRIPTION: esc(description || ui.tagline),
    CANONICAL: pageUrl(lang, rel),
    URL_EN: pageUrl("en", rel),
    URL_ZH: pageUrl("zh", rel),
    OG_TYPE: ogType || "website",
    OG_IMAGE: `${site.domain}/assets/images/${shareImage(lang)}`,
    OG_LOCALE: lang === "zh" ? "zh_CN" : "en_US",
    FEED_HREF: `${rootOverride || "../".repeat(depth)}${prefix(lang)}feed.xml`,
    FEED_TITLE: esc(ui.feedTitle),
    STRUCTURED_DATA: jsonld
      ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>`
      : "",
    ANALYTICS: "",
    ROOT: root,
    SKIP: esc(ui.skip),
    HOME_HREF: `${root}${prefix(lang)}index.html`,
    SITE_NAME: esc(ui.siteName),
    SITE_NAME_OTHER: esc(ui.siteNameOther),
    // Header wordmark, and the logo if one is set in site.json ("brand" → "logo")
    WORDMARK_EN: esc(site.brand.wordmark.en),
    WORDMARK_ZH: esc(site.brand.wordmark.zh),
    BRAND_LOGO: site.brand.logo ? `\n        ${inlineLogo("brand-logo")}` : "",
    FAVICON: esc(site.brand.favicon || "favicon.svg"),
    OTHER_LANG: site.ui[other].htmlLang,
    MENU: esc(ui.menu),
    NAV_LABEL: esc(ui.navLabel),
    NAV_ITEMS: navLinks("          ", true),
    SWITCH_HREF: `${root}${prefix(other)}${switchRel || rel}`,
    SWITCH_TITLE: esc(ui.switchTitle),
    SWITCH_LABEL: esc(ui.switchLabel),
    THEME_LABEL: esc(ui.themeLabel),
    TODAY_LABEL: esc(ui.todayLabel),
    SUNRISE: esc(ui.sunrise),
    SUNSET: esc(ui.sunset),
    SUN_SCRIPT: sunScript,
    THEME_AUTO: esc(ui.themeAuto),
    THEME_AUTO_TITLE: esc(ui.themeAutoTitle),
    THEME_LIGHT: esc(ui.themeLight),
    THEME_DARK: esc(ui.themeDark),
    TAGLINE: esc(ui.tagline),
    FOOTER_EXPLORE: esc(ui.footerExplore),
    FOOTER_LINKS: navLinks("            ", false),
    FOOTER_CONTACT: esc(ui.footerContact),
    EMAIL: esc(site.email),
    FOOTER_LEGAL: ui.footerLegal,
    // Privacy · RSS · Newsletter (the newsletter link appears once set in site.json)
    FOOTER_EXTRA: [
      `<a href="${root}${prefix(lang)}privacy.html">${esc(ui.privacy)}</a>`,
      `<a href="${root}${prefix(lang)}feed.xml">RSS</a>`,
      site.newsletter ? `<a href="${esc(site.newsletter)}">${esc(ui.newsletter)}</a>` : "",
    ].filter(Boolean).join(" · "),
    YEAR: String(new Date().getFullYear()),
    COPYRIGHT: esc(ui.copyright),
    CONTENT: content,
  };
  return layout.replace(/\{\{([A-Z_]+)\}\}/g, (all, key) => (key in values ? values[key] : all));
}

/* --------------------------------------------------------------- build */

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT_DIR, "static"), OUT, { recursive: true });

// Field colours and shapes come from site.json, so a new field only needs
// one line there. This writes them into assets/css/fields.css.
write(
  "assets/css/fields.css",
  "/* Generated by build.js from site.json — do not edit by hand. */\n" +
    Object.entries(site.fields)
      .map(([key, f]) => {
        const color = f.color || "#5e5a52";
        const tagBg = f.tagColor || color;
        const tagText = f.darkText ? "#2b2a28" : "#ffffff";
        return (
          `.tag--f-${key} { --field: ${color}; --field-tag: ${tagBg}; --field-tag-text: ${tagText}; }\n` +
          `.voice-card--f-${key} { --field: ${color}; }\n` +
          `.mark--${key} { color: ${color}; }\n` +
          // Night theme: brighter field colours with dark text, for contrast on dark
          (f.nightColor
            ? `:root[data-theme="night"] .tag--f-${key}, :root[data-theme="night"] .voice-card--f-${key} { --field: ${f.nightColor}; --field-tag: ${f.nightColor}; --field-tag-text: #1b1e25; }\n` +
              `:root[data-theme="night"] .mark--${key} { color: ${f.nightColor}; }\n` +
              `@media (prefers-color-scheme: dark) { :root:not([data-theme]) .tag--f-${key}, :root:not([data-theme]) .voice-card--f-${key} { --field: ${f.nightColor}; --field-tag: ${f.nightColor}; --field-tag-text: #1b1e25; } :root:not([data-theme]) .mark--${key} { color: ${f.nightColor}; } }`
            : "")
        );
      })
      .join("\n") +
    "\n"
);

const sitemap = [];

// 1. Normal pages (pages/en/*.html and pages/zh/*.html)
for (const lang of LANGS) {
  const dir = path.join(ROOT_DIR, "pages", lang);
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".html"))) {
    const label_ = `pages/${lang}/${file}`;
    const { data, body } = parseFrontMatter(read(label_), label_);
    const is404 = file === "404.html";
    const depth = lang === "zh" ? 1 : 0;
    const root = is404 ? "/" : "../".repeat(depth);
    const tokens = {
      LATEST_VOICES: () => latestVoices(lang, root),
      ALL_VOICES: () => allVoices(lang, root),
      CONTRIBUTORS: () => contributorsList(lang, root),
      EMAIL: () => esc(site.email),
      LOGO: () => inlineLogo("logo-figure", lang === "zh" ? "人类对齐研究院标志" : "Human Alignment Institute logo"),
      ROOT: () => root,
      // Privacy page: a paragraph about visit statistics, only when switched on
      ANALYTICS_NOTE: () => (site.analytics === "cloudflare" ? site.ui[lang].analyticsNote : ""),
    };
    const content = body
      .replace(/\{\{MARK:([a-z-]+)\}\}/g, (all, f) => (site.fields[f] ? fieldMark(f, "mark--lg") : all))
      .replace(/\{\{([A-Z_]+)\}\}/g, (all, key) => (tokens[key] ? tokens[key]() : all));
    const otherExists = fs.existsSync(path.join(ROOT_DIR, "pages", lang === "en" ? "zh" : "en", file));
    write(
      prefix(lang) + file,
      render({
        lang,
        rel: file,
        depth,
        title: data.title || "",
        description: data.description,
        navKey: file.replace(/\.html$/, ""),
        content,
        switchRel: otherExists ? file : "index.html",
        rootOverride: is404 ? "/" : null,
        jsonld: file === "index.html" ? { "@context": "https://schema.org", ...organization(), description: site.ui[lang].tagline } : null,
      })
    );
    if (!is404 && !data.noindex) sitemap.push(pageUrl(lang, file));
  }
}

// 2. One page per piece, in both site languages
for (const piece of voices) {
  for (const lang of LANGS) {
    const ui = site.ui[lang];
    const depth = (lang === "zh" ? 1 : 0) + 1;
    const root = "../".repeat(depth);
    const rel = `pieces/${piece.slug}.html`;
    const pieceLang = piece.language === "zh" ? "zh-Hans" : "en";
    const c = piece.author;
    const contributorsHref = `${root}${prefix(lang)}contributors.html`;

    // Video: the Chinese site prefers the Bilibili version (video_cn),
    // the English site the main link; the other is offered as a link.
    let video = "";
    if (piece.type === "video") {
      const a = { v: piece.video, url: piece.videoUrl }, b = { v: piece.videoCn, url: piece.videoCnUrl };
      const [main, alt] = lang === "zh" && b.v && b.v.src ? [b, a] : a.v && a.v.src ? [a, b] : [b, a];
      if (main.v && main.v.src) {
        video = `
        <div class="video-frame">
          <iframe src="${main.v.src}" title="${esc(ui.videoTitle)}: ${esc(piece.title)}" loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <p class="video-link"><a href="${esc(main.url)}">${esc(ui.watch)} → ${main.v.host}</a>${
          alt.v && alt.v.src ? ` · <a href="${esc(alt.url)}">${esc(fill(ui.alsoOn, { host: alt.v.host }))}</a>` : ""
        }</p>`;
      } else if (piece.videoUrl || piece.videoCnUrl) {
        video = `<p class="video-link"><a href="${esc(piece.videoUrl || piece.videoCnUrl)}">${esc(ui.watch)} →</a></p>`;
      } else {
        video = `<div class="video-frame video-frame--empty"><p>${esc(ui.videoMissing)}</p></div>`;
      }
    }

    // Editor's note (in the site's language when both are given)
    const note = lang === "zh" ? piece.editorNoteZh || piece.editorNote : piece.editorNote || piece.editorNoteZh;
    const noteLang = note === piece.editorNoteZh && piece.editorNoteZh ? "zh-Hans" : "en";
    const editorNote = note
      ? `
        <aside class="editor-note" aria-label="${esc(ui.editorNote)}">
          <p class="editor-note-label">${esc(ui.editorNote)}</p>
          <p lang="${noteLang}">${esc(note)}</p>
        </aside>`
      : "";

    // The other language version, if there is one
    const t = piece.translation;
    const translationLink = t
      ? `<p class="piece-translation"><a href="${root}${prefix(lang)}pieces/${t.slug}.html" hreflang="${t.language === "zh" ? "zh-Hans" : "en"}" lang="${t.language === "zh" ? "zh-Hans" : "en"}">${esc(site.readIn[t.language])} →</a></p>`
      : "";

    // Series
    const series = piece.series && site.series[piece.series];
    const seriesLine = series
      ? `<p class="piece-series">${esc(ui.partOf)}: <a href="${root}${prefix(lang)}voices.html?series=${piece.series}">${esc(series[lang] || series.en)}</a></p>`
      : "";

    // Rights and licence, at the end of the piece
    const year = (piece.date || "").slice(0, 4);
    const authorName = c ? contributorName(c, lang) : "";
    const rights =
      `<p class="piece-rights">${esc(piece.rights || fill(ui.rights, { year, author: authorName }))}` +
      (piece.license
        ? ` ${LICENSES[piece.license]
            ? fill(esc(ui.licensed), { license: `<a href="${LICENSES[piece.license]}" rel="license">${esc(piece.license)}</a>` })
            : esc(fill(ui.licensed, { license: piece.license }))}`
        : "") +
      `</p>`;

    const more = c ? listedFor(lang, c.pieces).filter((p) => p !== piece && p !== piece.translation).slice(0, 3) : [];
    const authorBox = c
      ? `
      <aside class="author-box" aria-labelledby="about-author">
        ${avatar(c, root, 80)}
        <div>
          <h2 id="about-author">${esc(ui.aboutAuthor)}</h2>
          <p class="author-name"><a href="${contributorsHref}#${c.slug}">${esc(contributorName(c, lang))}</a></p>
          <p lang="${contributorBio(c, lang).lang === "zh" ? "zh-Hans" : "en"}">${esc(contributorBio(c, lang).text)}</p>
          ${
            more.length
              ? `<p class="more-label">${esc(ui.moreByAuthor)}:</p><ul class="piece-list">${more
                  .map((p) => `<li><a href="${root}${prefix(lang)}pieces/${p.slug}.html">${esc(p.title)}</a></li>`)
                  .join("")}</ul>`
              : ""
          }
        </div>
      </aside>`
      : "";

    const content = `
    <article class="piece piece--${piece.type}">
      <header class="piece-header">
        <div class="container container--narrow">
          <p class="voice-tags">${tags(piece, lang, root, true)}</p>
          <h1 lang="${pieceLang}">${esc(piece.title)}</h1>
          <p class="piece-byline">${c ? `${ui.by}<a href="${contributorsHref}#${c.slug}">${esc(contributorName(c, lang))}</a> · ` : ""}<time datetime="${piece.date}">${formatDate(piece.date, lang)}</time></p>
          ${seriesLine}
          ${translationLink}
        </div>
      </header>
      <div class="container container--narrow piece-body">${editorNote}${video}
        <div class="prose" lang="${pieceLang}">
${piece.html}
        </div>
        ${rights}
${authorBox}
        <p class="back-link"><a href="${root}${prefix(lang)}voices.html">${esc(ui.backToVoices)}</a></p>
      </div>
    </article>`;

    write(
      prefix(lang) + rel,
      render({
        lang,
        rel,
        depth,
        title: piece.title,
        description: piece.summary,
        navKey: "voices",
        content,
        ogType: "article",
        // The language switch goes to the translation when there is one
        switchRel: piece.translation ? `pieces/${piece.translation.slug}.html` : rel,
        jsonld: {
          "@context": "https://schema.org",
          "@type": piece.type === "video" ? "VideoObject" : "Article",
          [piece.type === "video" ? "name" : "headline"]: piece.title,
          description: piece.summary,
          inLanguage: piece.language === "zh" ? "zh-Hans" : "en",
          datePublished: piece.date,
          uploadDate: piece.type === "video" ? piece.date : undefined,
          thumbnailUrl: piece.type === "video" ? `${site.domain}/assets/images/${shareImage(lang)}` : undefined,
          author: c ? { "@type": "Person", name: c.name } : undefined,
          publisher: organization(),
          url: pageUrl(lang, rel),
          license: LICENSES[piece.license],
        },
      })
    );
    sitemap.push(pageUrl(lang, rel));
  }
}

// 3. Sitemap for search engines
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`
);

// 4. RSS feeds, one per site language (feed.xml and zh/feed.xml)
const xml = (s) => esc(s).replace(/'/g, "&apos;");
for (const lang of LANGS) {
  const ui = site.ui[lang];
  const items = listedFor(lang).slice(0, 30);
  write(
    prefix(lang) + "feed.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>${xml(ui.feedTitle)}</title>
  <link>${pageUrl(lang, "voices.html")}</link>
  <atom:link href="${site.domain}/${prefix(lang)}feed.xml" rel="self" type="application/rss+xml"/>
  <description>${xml(ui.tagline)}</description>
  <language>${lang === "zh" ? "zh-cn" : "en"}</language>
${items
  .map((p) => {
    const url = pageUrl(lang, `pieces/${p.slug}.html`);
    return `  <item>
    <title>${xml(p.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>
    ${p.author ? `<dc:creator>${xml(contributorName(p.author, lang))}</dc:creator>` : ""}
    <description>${xml(p.summary)}</description>
  </item>`;
  })
  .join("\n")}
</channel>
</rss>
`
  );
}

warnings.forEach((w) => console.warn("  ! " + w));
console.log(
  `✓ Built ${voices.length} piece(s) and ${Object.keys(contributors).length} contributor(s) into public/`
);
