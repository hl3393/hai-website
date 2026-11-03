# Human Alignment Institution — Website

Website for **Human Alignment Institution (人类对齐研究院)**, a US nonprofit.
Domain: **humanalignmentinstitution.org**

The site is plain HTML, CSS and a tiny bit of JavaScript. There is **no build
step**: the files in this folder *are* the website. You edit a file, upload it
(or push it to GitHub), and the change goes live.

---

## 1. File structure

```
hai-website/
├── index.html          ← English Home page
├── about.html          ← English About (mission & vision)
├── research.html       ← English Research & Programs
├── news.html           ← English News
├── get-involved.html   ← English Get Involved
├── contact.html        ← English Contact
│
├── zh/                 ← Chinese (中文) versions of the same six pages
│   ├── index.html
│   ├── about.html
│   ├── research.html
│   ├── news.html
│   ├── get-involved.html
│   └── contact.html
│
├── assets/
│   ├── css/style.css   ← All colors, fonts and layout
│   ├── js/main.js      ← Mobile menu + footer year (you rarely need to touch this)
│   └── images/logo.svg ← Logo and browser-tab icon (placeholder)
│
├── 404.html            ← "Page not found" page
├── _headers            ← Security settings read by Cloudflare Pages
├── robots.txt          ← Instructions for search engines
├── sitemap.xml         ← List of pages for search engines
└── README.md           ← This file
```

**Key idea:** every English page has a Chinese twin with the *same file name*
inside the `zh/` folder. The **中文 / English** button in the top menu simply
links to the twin page. So when you change `about.html`, remember to make the
matching change in `zh/about.html`.

---

## 2. Tools you need

- A text editor. Free, beginner-friendly option: **Visual Studio Code**
  (https://code.visualstudio.com). Windows Notepad also works in a pinch.
  Don't use Word — it adds hidden formatting.
- A web browser to preview your work.

---

## 3. Preview the site on your computer

1. Download or clone this repository to your computer.
2. Open the folder and **double-click `index.html`**. It opens in your browser.
3. Click around — all links between pages work offline.
4. After editing a file, save it and press **Refresh** in the browser.

(The 404 page is the only one that looks unstyled when opened this way. That's
expected; it works correctly once deployed.)

---

## 4. Finding and replacing placeholder text

All text that still needs real content is **highlighted in yellow** on the
page and looks like this in the HTML:

```html
<span class="placeholder">[PLACEHOLDER: State your mission in one or two sentences.]</span>
```

In Chinese pages it says `[占位文字：...]` (or `[占位：...]` in the footer).

**To find them all:** in VS Code press `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`) and
search for `placeholder`. You'll see every spot in every file.

**To replace one**, change the whole thing — including the `<span>` tags — to
your real text.

Before:
```html
<p><span class="placeholder">[PLACEHOLDER: State your mission in one or two sentences.]</span></p>
```
After:
```html
<p>We advance research that keeps technology aligned with human values.</p>
```

Some placeholders sit on a whole element instead of a `<span>`, for example:
```html
<li class="placeholder">[PLACEHOLDER: Author(s). “Title.” Venue, Year.]</li>
```
For those, write your text and delete ` class="placeholder"`:
```html
<li>Doe, J. “Values in Machines.” Journal of Ethics, 2026.</li>
```

**Rule of thumb:** when no yellow boxes remain on the page, it's finished.

---

## 5. How a page is organized

Every page has the same three parts, marked with comments:

```html
<!-- ===== HEADER (same on every page) ===== -->      logo + menu
<!-- ===== MAIN CONTENT (edit this part) ===== -->     the page's own content
<!-- ===== FOOTER (same on every page) ===== -->      bottom of the page
```

You'll mostly edit the **MAIN CONTENT** part.

The header and footer are copied into all 12 pages (there's no build tool to
share them). If you change something there — for example the email address in
the footer — use VS Code's **Find and Replace in files**
(`Ctrl+Shift+H` / `Cmd+Shift+H`) to change it everywhere at once.

### A few HTML basics

| You write | You get |
|---|---|
| `<h2>Title</h2>` | A section heading |
| `<p>Some text.</p>` | A paragraph |
| `<a href="contact.html">Contact us</a>` | A link to another page |
| `<a href="https://example.org">Example</a>` | A link to another website |
| `<strong>bold</strong>` | **bold** |
| `<ul><li>One</li><li>Two</li></ul>` | A bulleted list |
| `&amp;` | The `&` character (HTML needs it written this way) |

Every opening tag like `<p>` needs a matching closing tag `</p>`.

---

## 6. Common tasks

### Add a news item
1. Open `news.html`.
2. Copy one complete block from `<li class="news-item">` down to its `</li>`.
3. Paste it at the **top** of the list (newest first).
4. Change the date in **both** places — the `datetime="2026-03-15"` part
   (format: year-month-day) and the visible text `March 15, 2026`.
5. Change the headline and summary.
6. Do the same in `zh/news.html` in Chinese (date format: `2026年3月15日`).
7. Optionally update the "Latest news" box on the two home pages.

### Add a card (research area, program, value…)
Copy one `<article class="card"> ... </article>` (or `<div class="card">`)
block and paste it next to the others. The grid rearranges automatically.

### Change the email address
Search all files for `info@humanalignmentinstitution.org` and replace it.

### Replace the logo
Replace `assets/images/logo.svg` with your own logo **using the same file
name**. A square SVG works best. If you only have a PNG, save it as
`assets/images/logo.png` and replace `logo.svg` with `logo.png` in all pages
(Find and Replace in files).

### Change the colors
Open `assets/css/style.css`. The colors are listed at the very top under
`:root`, e.g. `--color-primary: #1f5f6b;`. Change the hex code and every
button, link and highlight updates. Keep text dark on light backgrounds so it
stays readable.

### Add a new page
1. Copy an existing page, e.g. `about.html` → `team.html`, and also
   `zh/about.html` → `zh/team.html`.
2. Edit the `<title>`, `<meta name="description">` and the `canonical` /
   `alternate` links in the `<head>` of both copies (change `about` to `team`).
3. Replace the MAIN CONTENT.
4. In the new pages, move `aria-current="page"` to the right menu item (or
   remove it if the page isn't in the menu).
5. If it should appear in the menu, add a `<li>` line to the menu **and** the
   footer "Explore" list in all pages.
6. Add the new page to `sitemap.xml`.

---

## 7. Deploying on Cloudflare Pages

### First-time setup
1. Push this repository to GitHub (it's already there if you're reading this
   on GitHub).
2. Log in to https://dash.cloudflare.com → **Workers & Pages** →
   **Create** → **Pages** → **Connect to Git**.
3. Choose this repository and the **main** branch.
4. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: **/** (or leave empty)
5. Click **Save and Deploy**. You'll get a `*.pages.dev` address.
6. In the project, open **Custom domains** → add
   `humanalignmentinstitution.org` (and `www.humanalignmentinstitution.org`
   if you like) and follow the instructions.

### Every update after that
Commit and push your changes to the `main` branch on GitHub. Cloudflare
publishes the new version automatically within a minute or two.

You can also edit files directly on github.com: open the file, click the
pencil icon, make your change, and click **Commit changes**.

Note: Cloudflare serves pages without `.html` at the end
(e.g. `/about` instead of `/about.html`). That's normal; links still work.

---

## 8. Before going public — checklist

- [ ] No yellow placeholder boxes left on any of the 12 pages
- [ ] Email address confirmed to work
- [ ] Nonprofit / 501(c)(3) wording in the footer is accurate (only mention
      tax-exempt status or tax-deductible donations once it's confirmed)
- [ ] Real logo in `assets/images/logo.svg`
- [ ] English and Chinese pages say the same thing
- [ ] Checked on a phone

---

## 9. Design notes

- **No external fonts or trackers.** The site uses fonts already installed on
  visitors' devices. This keeps it fast and means it loads reliably for
  visitors in mainland China, where Google Fonts and similar services are
  often blocked.
- **Accessibility:** "skip to content" link, proper headings, visible keyboard
  focus, `lang` attributes for each language, and a mobile menu that works
  with the keyboard (Esc closes it). The menu also works with JavaScript
  turned off.
- **Search engines:** each page tells search engines about its other-language
  twin (`hreflang` tags) so the right version shows up for each audience.
