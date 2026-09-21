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
const siteOrigin = "https://zhehaoli1999.github.io";

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

function renderArticleHtml({ title, author, date, abstract, bodyHtml, slug, lang }) {
  const assetRoot = "../../";
  const canonical = `${siteOrigin}/blogs/${slug}/`;
  const safeTitle = escapeHtml(title);
  const safeAbstract = abstract ? escapeHtml(abstract) : "";
  const ledeBlock = abstract
    ? `      <p class="d-lede">${safeAbstract}</p>\n`
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
      </div>
    </header>
    <div class="d-body">
${bodyHtml}
    </div>
  </article>

  <footer class="d-footer">
    <a href="${assetRoot}blog.html">Back to all posts</a>
  </footer>

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
  return `      <div class="d-flex flex-row pb-3">
        <div class="d-none d-sm-inline pe-3 pub-thumb">
          <img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(post.title)}" class="img-fluid rounded img-thumbnail" width="125px">
        </div>
        <div class="d-inline">
          <h5><a class="title" href="blogs/${escapeHtml(post.slug)}/" target="_self">${escapeHtml(post.title)}</a></h5>
          <p>
            ${escapeHtml(post.abstract)}
            <br>
            <span style="color: #ED7D31">${escapeHtml(post.date)}</span>
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
  const items = sorted.map(renderBlogListItem).join("\n\n");
  const block = `${start}\n${items}\n      ${end}`;
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
  });

  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");

  posts.push({
    slug,
    title,
    abstract,
    date,
    dateObj: dateObj || new Date(0),
    thumbnail: meta.thumbnail || "files/duck_icon.png",
  });

  console.log(`Built blogs/${slug}/index.html`);
}

updateIndex(posts);
console.log(`Updated blog.html with ${posts.length} blog(s).`);
