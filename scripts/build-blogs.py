#!/usr/bin/env python3
"""Build static HTML blog pages from blogs/*.md (Distill-inspired layout)."""

from __future__ import annotations

import html
import re
from datetime import datetime
from pathlib import Path

import markdown
import yaml

ROOT = Path(__file__).resolve().parent.parent
BLOGS_DIR = ROOT / "blogs"
SITE_ORIGIN = "https://li-zhehao.github.io"

# categories a post can be tagged with, in the order they appear in the filter bar
CATEGORIES = ["paper reading", "thoughts", "technical"]

# sections of the blog page, in display order; a post picks one with `section:`
SECTIONS = ["Academic & Tech", "Reading Notes", "Miscellaneous"]
# fallback when a post does not name a section: first matching tag wins
SECTION_BY_TAG = {"technical": "Academic & Tech", "paper reading": "Reading Notes"}

MD_EXTENSIONS = [
    "markdown.extensions.fenced_code",
    "markdown.extensions.tables",
    "markdown.extensions.nl2br",
    "markdown.extensions.sane_lists",
]

try:
    import pygments  # noqa: F401

    MD_EXTENSIONS.append("markdown.extensions.codehilite")
    CODEHILITE_OPTS = {"css_class": "highlight", "guess_lang": False}
except ImportError:
    CODEHILITE_OPTS = {}


def parse_frontmatter(raw: str) -> tuple[dict, str]:
    if raw.startswith("---"):
        end = raw.find("\n---", 3)
        if end != -1:
            meta = yaml.safe_load(raw[3:end]) or {}
            body = raw[end + 4 :].lstrip("\n")
            return meta, body
    return {}, raw


def slug_from_path(path: Path) -> str:
    return path.stem


def parse_iso_date(slug: str, meta: dict) -> datetime | None:
    if meta.get("date"):
        if isinstance(meta["date"], datetime):
            return meta["date"]
        text = str(meta["date"])
        for fmt in ("%Y-%m-%d", "%Y/%m/%d"):
            try:
                return datetime.strptime(text[:10], fmt)
            except ValueError:
                pass
        try:
            return datetime.fromisoformat(text.replace("Z", "+00:00")[:10])
        except ValueError:
            return None
    match = re.match(r"^(\d{4}-\d{2}-\d{2})", slug)
    if match:
        return datetime.strptime(match.group(1), "%Y-%m-%d")
    return None


def format_display_date(date_obj: datetime | None, meta: dict) -> str:
    if meta.get("date") and date_obj is None:
        return str(meta["date"])
    if not date_obj:
        return ""
    return f"{date_obj.strftime('%B')} {date_obj.day}, {date_obj.year}"


def extract_abstract(meta: dict, content: str) -> str:
    if meta.get("abstract"):
        return str(meta["abstract"]).strip()
    if meta.get("description"):
        return str(meta["description"]).strip()
    quote = re.search(r"^>\s+(.+)$", content, re.MULTILINE)
    if quote:
        return quote.group(1).strip()
    for line in content.splitlines():
        line = line.strip()
        if line and not line.startswith("#") and not line.startswith("!"):
            return line[:220]
    return ""


def parse_tags(meta: dict) -> list[str]:
    """Read `tags:` (or `category:`) from the front matter, keeping known ones in order."""
    raw = meta.get("tags", meta.get("categories", meta.get("category", [])))
    if isinstance(raw, str):
        raw = [part.strip() for part in raw.split(",")]
    tags = [str(t).strip().lower() for t in (raw or []) if str(t).strip()]
    unknown = [t for t in tags if t not in CATEGORIES]
    for t in unknown:
        print(f"  note: unknown tag {t!r} (known: {', '.join(CATEGORIES)})")
    return [t for t in CATEGORIES if t in tags] + unknown


def parse_section(meta: dict, tags: list[str]) -> str:
    """Read `section:` from the front matter, else infer one from the tags."""
    raw = str(meta.get("section", "")).strip()
    if raw:
        for s in SECTIONS:
            if raw.lower() == s.lower():
                return s
        print(f"  note: unknown section {raw!r} (known: {', '.join(SECTIONS)})")
    for tag in tags:
        if tag in SECTION_BY_TAG:
            return SECTION_BY_TAG[tag]
    return SECTIONS[-1]


def render_tags(tags: list[str], css_class: str = "tag") -> str:
    return "".join(
        f'<span class="{css_class}">{html.escape(t)}</span>' for t in tags
    )


def indent_html(fragment: str, spaces: int = 6) -> str:
    pad = " " * spaces
    return "\n".join(pad + line if line else line for line in fragment.splitlines())


def render_article(
    *,
    title: str,
    author: str,
    date: str,
    abstract: str,
    body_html: str,
    slug: str,
    lang: str,
    tags: list[str],
) -> str:
    asset_root = "../../"
    canonical = f"{SITE_ORIGIN}/blogs/{slug}/"
    safe_title = html.escape(title)
    safe_abstract = html.escape(abstract)
    lede = f'      <p class="d-lede">{safe_abstract}</p>\n' if abstract else ""
    tag_html = f"\n        <span class=\"d-tags\">{render_tags(tags)}</span>" if tags else ""

    return f"""<!DOCTYPE html>
<html lang="{html.escape(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{safe_title} | Zhehao Li</title>
  <meta name="description" content="{safe_abstract}">
  <link rel="icon" type="image/x-icon" href="{asset_root}files/duck_icon.png">
  <link rel="canonical" href="{canonical}">
  <link rel="stylesheet" href="{asset_root}assets/blog.css">
  <script src="{asset_root}assets/theme.js"></script>
  <!-- GoatCounter: privacy-friendly page counts, no cookies -->
  <script data-goatcounter="https://zhehaoli.goatcounter.com/count"
    async src="//gc.zgo.at/count.js"></script>
  <script src="{asset_root}assets/reads.js?v=2"></script>
  <script src="https://kit.fontawesome.com/13cb060381.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github.min.css">
</head>
<body>
  <header class="d-site-header">
    <a class="d-brand" href="{asset_root}index.html">Zhehao Li</a>
    <nav>
      <a href="{asset_root}index.html">Home</a>
      <a href="{asset_root}index.html#news">News</a>
      <a href="{asset_root}index.html#publications">Publications</a>
      <a href="{asset_root}index.html#service">Service</a>
      <a href="{asset_root}index.html#teaching">Teaching</a>
      <a class="active" href="{asset_root}blog.html">Blog</a>
      <button type="button" class="theme-toggle" aria-label="Toggle theme"><i class="fa-solid fa-moon"></i></button>
    </nav>
  </header>

  <article class="d-article">
    <header>
      <h1 class="d-title">{safe_title}</h1>
{lede}      <div class="d-byline">
        <span><strong>{html.escape(author)}</strong></span>
        <span>{html.escape(date)}</span>
        <span class="d-reads" data-reads="/blogs/{html.escape(slug)}/" hidden></span>{tag_html}
      </div>
    </header>
    <div class="d-body">
{body_html}
    </div>
  </article>

  <section class="d-comments">
    <h2>Comments</h2>
    <p class="d-comments-note">Sign in with GitHub to comment. Threads live in this site's GitHub Discussions.</p>
    <div id="comments"></div>
  </section>

  <footer class="d-footer">
    <a href="{asset_root}blog.html">Back to all posts</a>
  </footer>

  <script src="{asset_root}assets/comments.js?v=2"></script>

  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function () {{
      if (typeof renderMathInElement === "function") {{
        renderMathInElement(document.body, {{
          delimiters: [
            {{ left: "$$", right: "$$", display: true }},
            {{ left: "$", right: "$", display: false }},
            {{ left: "\\\\(", right: "\\\\)", display: false }},
            {{ left: "\\\\[", right: "\\\\]", display: true }},
          ],
          throwOnError: false,
        }});
      }}
    }});
  </script>
</body>
</html>
"""


def render_blog_list_item(post: dict) -> str:
    url = f"blogs/{html.escape(post['slug'])}/index.html"
    tags = post["tags"]
    tag_attr = html.escape("|".join(tags))
    tag_html = f'\n            {render_tags(tags)}' if tags else ""
    return f"""      <div class="d-flex flex-row pb-3 blog-item" data-tags="{tag_attr}" data-section="{html.escape(post['section'])}">
        <div class="pe-3 pub-thumb">
          <a href="{url}" target="_self">
            <img src="{html.escape(post['thumbnail'])}" alt="{html.escape(post['title'])}" class="img-fluid rounded img-thumbnail" width="125px">
          </a>
        </div>
        <div class="d-inline">
          <h5><a class="title" href="{url}" target="_self">{html.escape(post['title'])}</a></h5>
          <p>
            {html.escape(post['abstract'])}
            <br>
            <span style="color: #ED7D31">{html.escape(post['date'])}</span>
            <span class="tag reads" data-reads="/blogs/{html.escape(post['slug'])}/" hidden></span>{tag_html}
          </p>
        </div>
      </div>"""


def update_index(posts: list[dict]) -> None:
    index_path = ROOT / "blog.html"
    content = index_path.read_text(encoding="utf-8")
    start = "      <!-- BLOG_LIST_START -->"
    end = "      <!-- BLOG_LIST_END -->"
    start_idx = content.find(start)
    end_match = re.search(r"\s*<!-- BLOG_LIST_END -->", content)
    if start_idx == -1 or not end_match:
        print("Blog list markers not found in blog.html; skipping blog list update.")
        return
    sorted_posts = sorted(posts, key=lambda p: p["date_obj"], reverse=True)
    groups = []
    for section in SECTIONS:
        in_section = [p for p in sorted_posts if p["section"] == section]
        if not in_section:
            continue
        heading = (
            f'      <h5 class="blog-section" data-section="{html.escape(section)}">'
            f"{html.escape(section)}</h5>"
        )
        groups.append("\n\n".join([heading] + [render_blog_list_item(p) for p in in_section]))
    block = f"{start}\n" + "\n\n".join(groups) + f"\n{end}"
    index_path.write_text(
        content[:start_idx] + block + content[end_match.end() :],
        encoding="utf-8",
    )


def main() -> None:
    md_kwargs: dict = {"extensions": MD_EXTENSIONS}
    if CODEHILITE_OPTS:
        md_kwargs["extension_configs"] = {"markdown.extensions.codehilite": CODEHILITE_OPTS}
    md = markdown.Markdown(**md_kwargs)

    posts: list[dict] = []
    for md_path in sorted(BLOGS_DIR.glob("*.md")):
        slug = slug_from_path(md_path)
        raw = md_path.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(raw)
        title = str(meta.get("title", slug)).strip()
        author = str(meta.get("author", "Zhehao Li"))
        date_obj = parse_iso_date(slug, meta)
        date = format_display_date(date_obj, meta)
        abstract = extract_abstract(meta, body)
        tags = parse_tags(meta)
        body_html = indent_html(md.convert(body))
        md.reset()
        lang = meta.get("lang") or (
            "zh" if re.search(r"[\u4e00-\u9fff]", title + body) else "en"
        )

        out_dir = BLOGS_DIR / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        article = render_article(
            title=title,
            author=author,
            date=date,
            abstract=abstract,
            body_html=body_html,
            slug=slug,
            lang=str(lang),
            tags=tags,
        )
        (out_dir / "index.html").write_text(article, encoding="utf-8")
        print(f"Built blogs/{slug}/index.html")

        posts.append(
            {
                "slug": slug,
                "title": title,
                "abstract": abstract,
                "date": date,
                "date_obj": date_obj or datetime.min,
                "thumbnail": meta.get("thumbnail", "files/duck_icon.png"),
                "tags": tags,
                "section": parse_section(meta, tags),
            }
        )

    update_index(posts)
    print(f"Updated blog.html with {len(posts)} blog(s).")


if __name__ == "__main__":
    main()
