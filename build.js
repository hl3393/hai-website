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

/* Turns a YouTube / Vimeo address into an embeddable player address. */
function videoEmbed(url) {
  if (!url) return null;
  let m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
  );
  if (m) return { src: `https://www.youtube-nocookie.com/embed/${m[1]}`, host: "YouTube" };
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { src: `https://player.vimeo.com/video/${m[1]}?dnt=1`, host: "Vimeo" };
  return { src: null, host: null };
}

/* --------------------------------------------------------- contributors */

const contributors = {};
for (const file of listMarkdown("content/contributors")) {
  const label_ = `content/contributors/${file}`;
  const { data, body } = parseFrontMatter(read(label_), label_);
  const slug = file.replace(/\.md$/, "");
  if (!data.name) errors.push(`${label_}: missing "name:"`);
  if (data.field && !site.fields[data.field])
    errors.push(`${label_}: field "${data.field}" is not listed in site.json`);
  contributors[slug] = {
    slug,
    name: data.name || slug,
    name_zh: data.name_zh || "",
    field: data.field || "",
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
  if (data.field && !site.fields[data.field])
    errors.push(
      `${label_}: field "${data.field}" is unknown. Use one of: ${Object.keys(site.fields).join(", ")}`
    );
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

  let video = null;
  if (data.type === "video") {
    video = videoEmbed(data.video);
    if (data.video && !video.src)
      warnings.push(`${label_}: could not recognise the video link (YouTube or Vimeo expected).`);
  }

  const html = marked.parse(body || "");
  const piece = {
    slug,
    file: label_,
    title: data.title || slug,
    author,
    date: data.date || "",
    field: data.field,
    type: data.type,
    language: data.language || "en",
    summary: data.summary || truncate(stripTags(html), 160),
    videoUrl: data.video || "",
    video,
    sample: isTrue(data.sample),
    featured: isTrue(data.featured),
    html,
  };
  voices.push(piece);
  if (author) author.pieces.push(piece);
}

voices.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

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

function tags(piece, lang, root, linkTags) {
  const fieldLabel = esc(label("fields", piece.field, lang));
  const typeLabel = esc(label("types", piece.type, lang));
  const href = (k, v) => `${root}${prefix(lang)}voices.html?${k}=${v}`;
  const t = (cls, text, k, v) =>
    linkTags
      ? `<a class="tag ${cls}" href="${href(k, v)}">${text}</a>`
      : `<span class="tag ${cls}">${text}</span>`;
  let out = t(`tag--type tag--${piece.type}`, typeLabel, "type", piece.type) + " " + t("", fieldLabel, "field", piece.field);
  if (piece.language !== lang) {
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
      <article class="voice-card voice-card--${piece.type}" data-field="${piece.field}" data-type="${piece.type}">
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
              `<button type="button" class="filter-btn" data-filter-group="${key}" data-value="${value}" aria-pressed="false">${esc(names[lang] || names.en)}</button>`
          )
          .join("\n        ")}
      </div>`;
  return `
    <div class="filters" data-filters hidden>
      ${group("field", ui.filterField, Object.entries(site.fields))}
      ${group("type", ui.filterType, Object.entries(site.types))}
      <p class="filter-status" aria-live="polite" data-filter-status data-template="${esc(ui.showing)}"></p>
    </div>`;
}

function allVoices(lang, root) {
  const ui = site.ui[lang];
  return `${filterBar(lang)}
    ${voiceGrid(voices, lang, root, " data-filter-list")}
    <p class="filter-empty" data-filter-empty hidden>${esc(ui.empty)}</p>`;
}

function latestVoices(lang, root) {
  const featured = voices.filter((v) => v.featured);
  const list = (featured.length ? featured : voices).slice(0, 3);
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
      const pieces = c.pieces.length
        ? `<ul class="piece-list">${c.pieces
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
          ${c.field ? `<p class="contributor-field">${esc(label("fields", c.field, lang))}</p>` : ""}
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

function render({ lang, rel, depth, title, description, navKey, content, ogType, switchRel, rootOverride }) {
  const ui = site.ui[lang];
  const other = lang === "en" ? "zh" : "en";
  const root = rootOverride || "../".repeat(depth);
  const navLinks = (indent, withCurrent) =>
    NAV_ORDER.map((key) => {
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
    ROOT: root,
    SKIP: esc(ui.skip),
    HOME_HREF: `${root}${prefix(lang)}index.html`,
    SITE_NAME: esc(ui.siteName),
    SITE_NAME_OTHER: esc(ui.siteNameOther),
    OTHER_LANG: site.ui[other].htmlLang,
    MENU: esc(ui.menu),
    NAV_LABEL: esc(ui.navLabel),
    NAV_ITEMS: navLinks("          ", true),
    SWITCH_HREF: `${root}${prefix(other)}${switchRel || rel}`,
    SWITCH_TITLE: esc(ui.switchTitle),
    SWITCH_LABEL: esc(ui.switchLabel),
    TAGLINE: esc(ui.tagline),
    FOOTER_EXPLORE: esc(ui.footerExplore),
    FOOTER_LINKS: navLinks("            ", false),
    FOOTER_CONTACT: esc(ui.footerContact),
    EMAIL: esc(site.email),
    FOOTER_LEGAL: ui.footerLegal,
    YEAR: String(new Date().getFullYear()),
    COPYRIGHT: esc(ui.copyright),
    CONTENT: content,
  };
  return layout.replace(/\{\{([A-Z_]+)\}\}/g, (all, key) => (key in values ? values[key] : all));
}

/* --------------------------------------------------------------- build */

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT_DIR, "static"), OUT, { recursive: true });

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
      ROOT: () => root,
    };
    const content = body.replace(/\{\{([A-Z_]+)\}\}/g, (all, key) => (tokens[key] ? tokens[key]() : all));
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
      })
    );
    if (!is404) sitemap.push(pageUrl(lang, file));
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

    let video = "";
    if (piece.type === "video") {
      if (piece.video && piece.video.src) {
        video = `
        <div class="video-frame">
          <iframe src="${piece.video.src}" title="${esc(ui.videoTitle)}: ${esc(piece.title)}" loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <p class="video-link"><a href="${esc(piece.videoUrl)}">${esc(ui.watch)} → ${piece.video.host}</a></p>`;
      } else if (piece.videoUrl) {
        video = `<p class="video-link"><a href="${esc(piece.videoUrl)}">${esc(ui.watch)} →</a></p>`;
      } else {
        video = `<div class="video-frame video-frame--empty"><p>${esc(ui.videoMissing)}</p></div>`;
      }
    }

    const more = c ? c.pieces.filter((p) => p !== piece).slice(0, 3) : [];
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
        </div>
      </header>
      <div class="container container--narrow piece-body">${video}
        <div class="prose" lang="${pieceLang}">
${piece.html}
        </div>
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

warnings.forEach((w) => console.warn("  ! " + w));
console.log(
  `✓ Built ${voices.length} piece(s) and ${Object.keys(contributors).length} contributor(s) into public/`
);
