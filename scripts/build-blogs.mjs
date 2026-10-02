import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const blogsDir = path.join(root, "blogs");
const siteOrigin = "https://li-zhehao.github.io";
// categories a post can be tagged with, in the order they appear in the filter bar
const CATEGORIES = ["paper reading", "thoughts", "technical"];
// sections of the blog page, in display order; a post picks one with `section:`
const SECTIONS = ["Academic & Tech", "Reading Notes", "Miscellaneous"];
const SECTION_BY_TAG = { technical: "Academic & Tech", "paper reading": "Reading Notes" };

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
  }),
);

marked.setOptions({
  gfm: true,
  breaks: false,
});

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugFromFilename(filename) {
  return path.basename(filename, ".md");
}

function parseIsoDate(slug, meta) {
  if (meta.date) {
    const parsed = new Date(meta.date);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  }
  const match = slug.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  return new Date(`${match[1]}T12:00:00`);
}

function formatDisplayDate(dateObj, meta) {
  if (typeof meta.date === "string" && Number.isNaN(new Date(meta.date).getTime())) {
    return meta.date;
  }
  if (!dateObj) return "";
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function extractAbstract(meta, content) {
  if (meta.abstract) return meta.abstract;
  if (meta.description) return meta.description;
  const quote = content.match(/^>\s+(.+)$/m);
  if (quote) return quote[1].trim();
  const paragraph = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("!"));
  return paragraph ? paragraph.slice(0, 220) : "";
}

function parseTags(meta) {
  let raw = meta.tags ?? meta.categories ?? meta.category ?? [];
  if (typeof raw === "string") raw = raw.split(",");
  const tags = (raw || []).map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  const unknown = tags.filter((t) => !CATEGORIES.includes(t));
  for (const t of unknown) {
    console.warn(`  note: unknown tag "${t}" (known: ${CATEGORIES.join(", ")})`);
  }
  return [...CATEGORIES.filter((c) => tags.includes(c)), ...unknown];
}

function parseSection(meta, tags) {
  const raw = String(meta.section || "").trim();
  if (raw) {
    const hit = SECTIONS.find((s) => s.toLowerCase() === raw.toLowerCase());
    if (hit) return hit;
    console.warn(`  note: unknown section "${raw}" (known: ${SECTIONS.join(", ")})`);
  }
  const tag = tags.find((t) => SECTION_BY_TAG[t]);
  return tag ? SECTION_BY_TAG[tag] : SECTIONS[SECTIONS.length - 1];
}

function renderTags(tags, cssClass = "tag") {
  return tags.map((t) => `<span class="${cssClass}">${escapeHtml(t)}</span>`).join("");
}

function renderArticleHtml({ title, author, date, abstract, bodyHtml, slug, lang, tags }) {
  const assetRoot = "../../";
  const canonical = `${siteOrigin}/blogs/${slug}/`;
  const safeTitle = escapeHtml(title);
  const safeAbstract = abstract ? escapeHtml(abstract) : "";
  const ledeBlock = abstract
    ? `      <p class="d-lede">${safeAbstract}</p>\n`
    : "";
  const tagHtml = tags && tags.length
    ? `\n        <span class="d-tags">${renderTags(tags)}</span>`
    : "";

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang || "en")}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle} | Zhehao Li</title>
  <meta name="description" content="${safeAbstract}">
  <link rel="icon" type="image/x-icon" href="${assetRoot}files/duck_icon.png">
  <link rel="canonical" href="${canonical}">
  <link rel="stylesheet" href="${assetRoot}assets/blog.css">
  <script src="${assetRoot}assets/theme.js"></script>
  <!-- GoatCounter: privacy-friendly page counts, no cookies -->
  <script data-goatcounter="https://zhehaoli.goatcounter.com/count"
    async src="//gc.zgo.at/count.js"></script>
  <script src="${assetRoot}assets/reads.js?v=3"></script>
  <script src="https://kit.fontawesome.com/13cb060381.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github.min.css">
</head>
<body>
  <header class="d-site-header">
    <a class="d-brand" href="${assetRoot}index.html">Zhehao Li</a>
    <nav>
      <a href="${assetRoot}index.html">Home</a>
      <a href="${assetRoot}index.html#news">News</a>
      <a href="${assetRoot}index.html#publications">Publications</a>
      <a href="${assetRoot}index.html#service">Service</a>
      <a href="${assetRoot}index.html#teaching">Teaching</a>
      <a class="active" href="${assetRoot}blog.html">Blog</a>
      <button type="button" class="theme-toggle" aria-label="Toggle theme"><i class="fa-solid fa-moon"></i></button>
    </nav>
  </header>

  <article class="d-article">
    <header>
      <h1 class="d-title">${safeTitle}</h1>
${ledeBlock}      <div class="d-byline">
        <span><strong>${escapeHtml(author)}</strong></span>
        <span>${escapeHtml(date)}</span>
        <span class="d-reads" data-reads="/blogs/${escapeHtml(slug)}/" hidden></span>${tagHtml}
      </div>
    </header>
    <div class="d-body">
${bodyHtml}
    </div>
  </article>

  <section class="d-comments">
    <h2>Comments</h2>
    <p class="d-comments-note">Sign in with GitHub to comment. Threads live in this site's GitHub Discussions.</p>
    <div id="comments"></div>
  </section>

  <footer class="d-footer">
    <a href="${assetRoot}blog.html">Back to all posts</a>
  </footer>

  <script src="${assetRoot}assets/comments.js?v=3"></script>

  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      if (typeof renderMathInElement === "function") {
        renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\\\(", right: "\\\\)", display: false },
            { left: "\\\\[", right: "\\\\]", display: true },
          ],
          throwOnError: false,
        });
      }
    });
  </script>
</body>
</html>
`;
}

function renderBlogListItem(post) {
  const tagHtml = post.tags.length ? `\n            ${renderTags(post.tags)}` : "";
  return `      <div class="d-flex flex-row pb-3 blog-item" data-tags="${escapeHtml(post.tags.join("|"))}" data-section="${escapeHtml(post.section)}">
        <div class="pe-3 pub-thumb">
          <img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(post.title)}" class="img-fluid rounded img-thumbnail" width="125px">
        </div>
        <div class="d-inline">
          <h5><a class="title" href="blogs/${escapeHtml(post.slug)}/" target="_self">${escapeHtml(post.title)}</a></h5>
          <p>
            ${escapeHtml(post.abstract)}
            <br>
            <span style="color: #ED7D31">${escapeHtml(post.date)}</span>${tagHtml}
          </p>
        </div>
      </div>`;
}

function updateIndex(posts) {
  const indexPath = path.join(root, "blog.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const start = "      <!-- BLOG_LIST_START -->";
  const end = "      <!-- BLOG_LIST_END -->";
  const startIdx = html.indexOf(start);
  const endIdx = html.indexOf(end);
  if (startIdx === -1 || endIdx === -1) {
    console.warn("Blog list markers not found in blog.html; skipping blog list update.");
    return;
  }
  const sorted = [...posts].sort((a, b) => b.dateObj - a.dateObj);
  const groups = SECTIONS.map((section) => {
    const inSection = sorted.filter((p) => p.section === section);
    if (!inSection.length) return null;
    const heading = `      <h5 class="blog-section" data-section="${escapeHtml(section)}">${escapeHtml(section)}</h5>`;
    return [heading, ...inSection.map(renderBlogListItem)].join("\n\n");
  }).filter(Boolean);
  const block = `${start}\n${groups.join("\n\n")}\n      ${end}`;
  html = html.slice(0, startIdx) + block + html.slice(endIdx + end.length);
  fs.writeFileSync(indexPath, html);
}

function indentHtml(html, spaces = 6) {
  const pad = " ".repeat(spaces);
  return html
    .split("\n")
    .map((line) => (line ? pad + line : line))
    .join("\n");
}

const markdownFiles = fs
  .readdirSync(blogsDir)
  .filter((name) => name.endsWith(".md"))
  .map((name) => path.join(blogsDir, name));

const posts = [];

for (const filePath of markdownFiles) {
  const slug = slugFromFilename(path.basename(filePath));
  const raw = fs.readFileSync(filePath, "utf8");
  const { data: meta, content } = matter(raw);
  const title = (meta.title || slug).trim();
  const author = meta.author || "Zhehao Li";
  const dateObj = parseIsoDate(slug, meta);
  const date = formatDisplayDate(dateObj, meta);
  const abstract = extractAbstract(meta, content);
  const bodyHtml = indentHtml(marked.parse(content));
  const tags = parseTags(meta);
  const section = parseSection(meta, tags);
  const lang =
    meta.lang || (/[\u4e00-\u9fff]/.test(title + content) ? "zh" : "en");

  const outDir = path.join(blogsDir, slug);
  fs.mkdirSync(outDir, { recursive: true });

  const html = renderArticleHtml({
    title,
    author,
    date,
    abstract,
    bodyHtml,
    slug,
    lang,
    tags,
  });

  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");

  posts.push({
    slug,
    title,
    abstract,
    date,
    dateObj: dateObj || new Date(0),
    thumbnail: meta.thumbnail || "files/duck_icon.png",
    tags,
    section,
  });

  console.log(`Built blogs/${slug}/index.html`);
}

updateIndex(posts);
console.log(`Updated blog.html with ${posts.length} blog(s).`);
