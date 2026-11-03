# Human Alignment Institute — Website

Website of **Human Alignment Institute (人类对齐研究院)** · **humanalignmentinstitute.org**

> Human Alignment Institute gathers stories of how people across every field
> live and work with AI. We ask not how much more efficient AI makes us, but
> how we remain human alongside it.

The site is bilingual (English / 中文) and curated: the editor invites pieces
(essays, blog posts, videos) and publishes them. **Each piece is one simple
text file.** Add a file, and the piece appears on the site automatically.

**Jump to:** [How to publish a new piece (English)](#how-to-publish-a-new-piece) ·
[如何发布新作品（中文）](#如何发布新作品)

---

## 1. How the site works (in one minute)

You write **content** (simple text files). A small program, `build.js`, turns
the content into a finished website in a folder called `public/`. Cloudflare
Pages runs this program for you **every time you save a change to GitHub**, then
publishes the result. You never have to edit the `public/` folder yourself.

```
  content/voices/my-piece.md   ──►   build.js   ──►   public/   ──►   the live website
  (you write this)                  (automatic)      (automatic)
```

## 2. File structure

```
hai-website/
├── content/
│   ├── voices/               ← ONE FILE PER PIECE (essay, blog or video)
│   │   ├── _template.md      ← copy this to start a new piece
│   │   ├── sample-essay.md   ← sample placeholders: replace or delete
│   │   ├── sample-blog.md
│   │   └── sample-video.md
│   └── contributors/         ← ONE FILE PER AUTHOR
│       ├── _template.md      ← copy this to add a new author
│       └── sample-contributor-a.md …
│
├── pages/                    ← The fixed pages (text you can edit)
│   ├── en/                   ← English: index (Home), voices, contributors, thaap, about, 404
│   └── zh/                   ← Chinese: the same pages in 中文
│
├── static/                   ← Copied to the site as-is
│   ├── assets/css/style.css  ← Colors, fonts, layout
│   ├── assets/js/main.js     ← Mobile menu + Voices filters
│   ├── assets/images/        ← Logo, and contributors/ for author photos
│   ├── _headers              ← Security settings for Cloudflare
│   └── robots.txt
│
├── templates/layout.html     ← Header + footer around every page
├── site.json                 ← Settings: email, fields, types, menu labels
├── build.js                  ← The program that builds the site (don't need to touch)
├── preview.js                ← Lets you preview the site on your computer
└── package.json              ← Tells Cloudflare how to build
```

Files whose names start with `_` (like `_template.md`) are ignored by the site.

---

<a id="how-to-publish-a-new-piece"></a>
## 3. How to publish a new piece (English)

You can do all of this **in your web browser on github.com**, with nothing
installed on your computer.

### Step 1: Make sure the author exists

Open the folder `content/contributors/` on GitHub. Is there already a file for
this author (for example `li-wei.md`)?

- **Yes:** remember the file name without `.md` (e.g. `li-wei`). Go to step 2.
- **No:** create one:
  1. Click **Add file → Create new file**.
  2. Name it after the person, lowercase with dashes:
     `content/contributors/li-wei.md`
  3. Paste this and fill it in:
     ```
     ---
     name: Li Wei
     name_zh: 李伟
     field: education
     role: practitioner
     photo: placeholder.svg
     bio: Middle-school teacher in Chengdu who writes about classrooms and AI.
     bio_zh: 成都的中学教师，关注课堂与 AI。
     ---
     ```
  4. Click **Commit changes**.

  *Photo (optional):* open `static/assets/images/contributors/`, click
  **Add file → Upload files**, upload a square photo (about 400×400 pixels),
  e.g. `li-wei.jpg`. Then change the line to `photo: li-wei.jpg`.

### Step 2: Create the piece

1. Open `content/voices/` and click **Add file → Create new file**.
2. Name the file in lowercase with dashes. **This becomes the web address.**
   Example: `content/voices/what-i-keep-for-myself.md` becomes
   `humanalignmentinstitute.org/pieces/what-i-keep-for-myself`.
3. Paste this header at the very top and fill it in:
   ```
   ---
   title: What I keep for myself
   author: li-wei
   date: 2026-11-15
   field: education, everyday
   role: practitioner
   type: essay
   language: en
   video:
   summary: A teacher on the one part of her job she won't automate.
   ---
   ```
4. Under the second `---` line, paste the text of the piece.
   Leave an **empty line between paragraphs**.
5. Click **Commit changes**. Wait 1–2 minutes and the piece is live: on the
   Voices page, on the author's entry on the Contributors page, and (if it's
   one of the 3 newest) on the Home page.

### What each header line means

| Line | What to write |
|---|---|
| `title:` | The title, exactly as it should appear |
| `author:` | The author's file name in `content/contributors/`, without `.md` |
| `date:` | Year-month-day, e.g. `2026-11-15` (newest pieces are shown first) |
| `field:` | **One or more** fields, separated by commas, e.g. `education, public` (see the table below) |
| `role:` | **One** role: `researcher`, `practitioner` or `learner`. If you leave it out, the role from the author's profile is used |
| `type:` | `essay`, `blog` or `video` |
| `language:` | The language the piece is written in: `en` or `zh` |
| `video:` | Videos only: a YouTube or Vimeo link, e.g. `https://www.youtube.com/watch?v=…` or `https://vimeo.com/123456789` |
| `summary:` | *Optional.* One sentence shown on the cards. If empty, the first lines of the text are used |
| `featured:` | *Optional.* `true` pins the piece to the Home page |
| `draft:` | *Optional.* `true` hides the piece until you're ready |

### Fields and roles: what to type

Every piece has two independent tags: **field** (what area of life it is
about, one or more) and **role** (the author's position in it, exactly one).
Readers can filter the Voices page by field, role and type, and combine them.

| Type this after `field:` | Shown on the site as |
|---|---|
| `education` | Education |
| `arts` | Arts & Humanities |
| `science` | Science, Technology & Industry |
| `public` | Public & Social Service |
| `everyday` | Work & Everyday Life |

| Type this after `role:` | Shown on the site as | Use when the author speaks as… |
|---|---|---|
| `researcher` | Researcher | someone who studies the subject |
| `practitioner` | Practitioner | someone who does the work (teacher, artist, nurse, engineer…) |
| `learner` | Learner | someone learning: a student, or anyone learning something new |

Example: a teacher writing about using AI with students and parents →
`field: education, public` and `role: practitioner`.

The role is set **per piece** because the same person may write once as a
researcher and once as a learner. The role in the author's profile is the
default when a piece doesn't give one.

### For a video

Set `type: video` and paste the YouTube or Vimeo link after `video:`. The
player appears at the top of the page automatically. Any text you write below
the header appears under the video (an introduction or a transcript).

### Formatting the text (Markdown)

| You type | You get |
|---|---|
| An empty line | A new paragraph |
| `## A subheading` | A subheading |
| `*italic*` | *italic* |
| `**bold**` | **bold** |
| `> A quotation` | An indented quotation |
| `[link text](https://example.org)` | A link |
| `---` on its own line (in the text) | A section break (· · ·) |

### Each piece appears in both languages of the site

Every piece is shown on both the English and the Chinese site. Its text
stays in the language it was written in, and a small "Chinese" or "英文" label
tells readers which language that is.

### If something goes wrong

If a header line is wrong (for example a misspelled field), the build stops
and **the old version of the site stays online**, so nothing breaks for
visitors. To see why: in Cloudflare open **Workers & Pages → your project →
Deployments**, click the failed deployment, and read the log. It names the
file and the problem in plain words, e.g.:

```
✗ The site was NOT built. Please fix these problems:
  • content/voices/my-piece.md: field "music" is unknown. Use one or more of: education, arts, science, public, everyday (separated by commas)
```

Fix the file on GitHub, commit again, and the site rebuilds.

### Editing or removing a piece

- **Edit:** open the file on GitHub, click the pencil ✏️, change it, commit.
- **Hide temporarily:** add the line `draft: true` to the header.
- **Remove:** open the file, click **⋯ → Delete file**, commit.

---

<a id="如何发布新作品"></a>
## 4. 如何发布新作品（中文）

以下操作都可以**直接在 github.com 网页上完成**，电脑上无需安装任何软件。

### 第一步：确认作者已存在

在 GitHub 上打开文件夹 `content/contributors/`，看看是否已有该作者的文件（例如 `li-wei.md`）。

- **有：**记下文件名（去掉 `.md`，例如 `li-wei`），进入第二步。
- **没有：**新建一个：
  1. 点击 **Add file → Create new file**。
  2. 用英文小写字母和连字符命名，例如：`content/contributors/li-wei.md`
  3. 粘贴以下内容并填写：
     ```
     ---
     name: Li Wei
     name_zh: 李伟
     field: education
     role: practitioner
     photo: placeholder.svg
     bio: Middle-school teacher in Chengdu who writes about classrooms and AI.
     bio_zh: 成都的中学教师，关注课堂与 AI。
     ---
     ```
     （`name` 和 `bio` 显示在英文网站上，`name_zh` 和 `bio_zh` 显示在中文网站上。）
  4. 点击 **Commit changes** 保存。

  *照片（可选）：*打开 `static/assets/images/contributors/`，点击 **Add file → Upload files**，
  上传一张方形照片（约 400×400 像素），例如 `li-wei.jpg`，然后把 `photo:` 一行改为 `photo: li-wei.jpg`。

### 第二步：新建作品文件

1. 打开 `content/voices/`，点击 **Add file → Create new file**。
2. 用英文小写字母和连字符为文件命名，**文件名就是网址**。
   例如 `content/voices/what-i-keep-for-myself.md` 的网址是
   `humanalignmentinstitute.org/pieces/what-i-keep-for-myself`。
   （文件名请勿使用中文或空格。）
3. 在文件最上方粘贴以下“文件头”并填写：
   ```
   ---
   title: 我留给自己的东西
   author: li-wei
   date: 2026-11-15
   field: education, everyday
   role: practitioner
   type: essay
   language: zh
   video:
   summary: 一位教师谈她不愿交给 AI 的那部分工作。
   ---
   ```
4. 在第二条 `---` 下面粘贴正文。**段落之间空一行。**
5. 点击 **Commit changes**。等待 1–2 分钟，作品就会自动出现在“声音”页面、作者页面中该作者的条目下；如果是最新的 3 篇之一，也会出现在首页。

### 文件头各行的含义

| 行 | 填写内容 |
|---|---|
| `title:` | 标题，按希望显示的样子填写 |
| `author:` | 作者在 `content/contributors/` 中的文件名（去掉 `.md`） |
| `date:` | 年-月-日，例如 `2026-11-15`（最新的作品排在最前） |
| `field:` | 领域，**可填一个或多个**，用英文逗号分隔，例如 `education, public`（见下表） |
| `role:` | 身份，**只填一个**：`researcher`、`practitioner` 或 `learner`。不填则使用作者资料中的身份 |
| `type:` | 类型：`essay`（随笔）、`blog`（博客）、`video`（视频） |
| `language:` | 作品所用语言：`en`（英文）或 `zh`（中文） |
| `video:` | 仅视频需要：YouTube 或 Vimeo 链接 |
| `summary:` | *可选。*卡片上显示的一句话简介；留空则自动截取正文开头 |
| `featured:` | *可选。*填 `true` 可将作品固定显示在首页 |
| `draft:` | *可选。*填 `true` 可暂时隐藏作品 |

**注意：**冒号 `:` 必须是英文半角冒号；`field`、`role`、`type`、`language` 的值必须用表中的英文单词。

### 领域与身份：填写对照表

每篇作品有两个互相独立的标签：**领域**（作品涉及的生活领域，可多个）和**身份**（作者在其中的身份，仅一个）。读者可在“声音”页面按领域、身份和类型筛选，并可组合使用。

| `field:` 后填写 | 网站显示为 |
|---|---|
| `education` | 教育 |
| `arts` | 艺术与人文 |
| `science` | 科学、技术与产业 |
| `public` | 公共与社会服务 |
| `everyday` | 劳动与日常生活 |

| `role:` 后填写 | 网站显示为 | 适用于作者以……身份发言 |
|---|---|---|
| `researcher` | 研究者 | 研究这一主题的人 |
| `practitioner` | 从业者 | 从事这项工作的人（教师、艺术家、护士、工程师……） |
| `learner` | 学习者 | 正在学习的人：学生，或任何在学习新事物的人 |

例如：一位教师写她如何与学生和家长一起使用 AI → `field: education, public`，`role: practitioner`。

身份是**按作品**填写的，因为同一个人可能这次以研究者身份写作，下次以学习者身份写作。作品未填写身份时，使用作者资料中的身份。

### 发布视频

把 `type:` 设为 `video`，在 `video:` 后粘贴 YouTube 或 Vimeo 链接，页面顶部就会自动出现播放器。文件头下面的文字会显示在视频下方，可以写简介或文字稿。

（提示：YouTube 和 Vimeo 在中国大陆通常无法直接访问。如果读者主要在国内，可在正文中另附 B 站等平台的链接。）

### 正文排版（Markdown）

| 输入 | 效果 |
|---|---|
| 空一行 | 新段落 |
| `## 小标题` | 小标题 |
| `*斜体*` | *斜体* |
| `**加粗**` | **加粗** |
| `> 引文` | 缩进的引文 |
| `[链接文字](https://example.org)` | 链接 |
| 单独一行 `---`（在正文中） | 分节符（· · ·） |

### 出错了怎么办？

如果文件头写错（例如领域拼错），网站不会更新，**线上仍保留旧版本**，访客不受影响。查看原因：在 Cloudflare 打开 **Workers & Pages → 项目 → Deployments**，点击失败的那次部署并查看日志，日志会写明是哪个文件、什么问题。在 GitHub 上改正后再次提交即可。

### 修改或删除作品

- **修改：**在 GitHub 上打开文件，点击铅笔图标 ✏️，修改后提交。
- **暂时隐藏：**在文件头中加一行 `draft: true`。
- **删除：**打开文件，点击 **⋯ → Delete file** 并提交。

---

## 5. Editing the fixed pages

The Home, Voices, Contributors, THAAP and About pages live in `pages/en/` and
`pages/zh/`. Each file starts with a short header (`title`, `description`)
and then plain HTML. Edit the English and Chinese versions together.

Some words in double braces are filled in automatically, so keep them:

| Token | Becomes |
|---|---|
| `{{LATEST_VOICES}}` | The 3 newest (or `featured`) pieces, on Home |
| `{{ALL_VOICES}}` | All pieces with the Field / Role / Type filters, on Voices |
| `{{CONTRIBUTORS}}` | The list of authors and their pieces, on Contributors |
| `{{EMAIL}}` | The email address from `site.json` |

**Placeholders:** text still to be written is highlighted in yellow and looks
like `<span class="placeholder">[PLACEHOLDER: …]</span>` (Chinese:
`[占位文字：…]`). Replace the whole `<span>…</span>` with your text. Search the
project for `placeholder` to find them all. They are on the About page
(founder, address), THAAP page (details), and in `site.json` (the footer's
nonprofit-status line). Only mention 501(c)(3) status or tax-deductible
donations once confirmed.

**Sample content:** the three sample pieces and three sample contributors
carry a yellow "Sample" label. Delete those files once real pieces are in.

## 6. Settings in `site.json`

- **Email address:** change `"email"`.
- **Add a field** (e.g. Health): add a line inside `"fields"`:
  `"health": { "en": "Health", "zh": "健康", "color": "#4F6B73", "shape": "circle" },`.
  Each field has a colour and a small geometric mark. Shapes available:
  `circle`, `triangle`, `square`, `half-circle`, `bar`. For a light colour,
  add `"darkText": true` so the tag text stays readable. It appears in the filters
  automatically, and pieces can use `field: health`. Roles (`"roles"`) and
  types (`"types"`) work the same way.
- **Rename a field on the site:** change only the `"en"` / `"zh"` text. Keep
  the short key on the left (e.g. `"science"`), because the content files use it.
- **Menu labels, footer text:** under `"ui"` → `"en"` / `"zh"`.

`site.json` is strict: keep the quotes and commas exactly as in the
surrounding lines (no comma after the last item in a list).

## 7. Look and feel

Colors and fonts are at the top of `static/assets/css/style.css` (`:root`).
The logo is `static/assets/images/logo.svg` (a placeholder; replace it with
the same file name). The site uses fonts already installed on readers'
devices, with no Google Fonts or trackers, so it loads quickly and also works
in mainland China.

### Time-of-day themes

The site's colours follow the sun, using the visitor's own clock (no
location is asked for):

| Theme | Roughly when | Look |
|---|---|---|
| Sunrise | about 1 h before to 1.5 h after sunrise | soft apricot rising from the bottom of the screen |
| Day | daytime | the neutral near-white design (default) |
| Sunset | about 1.5 h before to 1 h after sunset | warm amber / rose-grey |
| Night | the rest of the night | dark charcoal-indigo |

Sunrise and sunset hours change by month (a mid-northern-latitude
approximation). Visitors can pick **Auto / Light / Dark** in the header;
the choice is remembered on their device. With no choice, a device set to
dark mode gets the night theme.

- Theme colours: the `THEMES` section at the end of `static/assets/css/style.css`.
- Sunrise/sunset hours per month: the `SUN` list in the `<script>` at the top of
  `templates/layout.html` (`[sunrise, sunset]` in hours, January first).
- Night-time field colours: `"nightColor"` for each field in `site.json`.

## 8. Deploying on Cloudflare Pages

**First-time setup (or update an existing project under Settings → Builds):**

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Choose this repository, branch **main**.
3. Build settings:
   - Framework preset: **None**
   - Build command: **`npm run build`**
   - Build output directory: **`public`**
4. **Save and Deploy.** Then under **Custom domains** add
   `humanalignmentinstitute.org`.

After that, every commit to `main` rebuilds and republishes the site
automatically in 1–2 minutes. Pages are served without `.html`
(e.g. `/about`), which is normal.

## 9. Previewing on your own computer (optional)

Only needed if you want to check changes before publishing.

1. Install **Node.js** (LTS version) from https://nodejs.org.
2. Open a terminal in this folder and run, once:
   ```bash
   npm install
   ```
3. Every time you want to preview:
   ```bash
   npm run preview
   ```
   then open http://localhost:8080 in your browser. Press `Ctrl+C` to stop.

`npm run build` only builds the `public/` folder without starting the preview.

## 10. Accessibility

Skip-to-content link, semantic headings, visible keyboard focus, correct
`lang` attributes for English and Chinese text, keyboard-friendly menu (Esc
closes it), filter buttons announced to screen readers, and everything
(menu, all pieces) still works with JavaScript turned off.
