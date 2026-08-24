"""Build the static website from shared templates."""

import html
import json
import re
from pathlib import Path
from string import Template
from textwrap import dedent
from urllib.parse import urlparse

ROOT = Path(__file__).parent
TEMPLATES = ROOT / "templates"
HEADER_PLACEHOLDER = "<!-- include: partials/header.html -->"
EXTRA_STYLES_PLACEHOLDER = "<!-- include: extra-styles -->"
CONTENT_PLACEHOLDER = "<!-- include: page-content -->"
SELECTED_PUBLICATIONS_PLACEHOLDER = "<!-- include: selected-publications -->"
ALL_PUBLICATIONS_PLACEHOLDER = "<!-- include: all-publications -->"
PREPRINTS_PLACEHOLDER = "<!-- include: preprints -->"
LAB_TABS = ("home", "people", "gallery", "resources")

PAGES = {
    "index.html": {},
    "publications.html": {},
    "funds.html": {},
    "services.html": {},
    "talks.html": {},
    "lab.html": {"extra_styles": '<link href="css/lab.css" rel="stylesheet" />'},
}


def indent_fragment(fragment: str, spaces: int) -> str:
    indentation = " " * spaces
    return "\n".join(
        f"{indentation}{line}" if line else ""
        for line in dedent(fragment).strip().splitlines()
    )


def replace_placeholder(source: str, placeholder: str, fragment: str) -> str:
    if source.count(placeholder) != 1:
        raise ValueError(f"Expected exactly one {placeholder!r}")

    return re.sub(
        rf"^(?P<indent>[ \t]*){re.escape(placeholder)}[ \t]*$",
        lambda match: indent_fragment(fragment, len(match.group("indent"))),
        source,
        count=1,
        flags=re.MULTILINE,
    )


def formatted_text(value: object) -> str:
    """Escape text while preserving the b/sup tags used by publication data."""
    tokens = re.split(r"(</?(?:b|sup)>)", str(value or ""), flags=re.IGNORECASE)
    return "".join(
        token.lower() if re.fullmatch(r"</?(?:b|sup)>", token, re.IGNORECASE)
        else html.escape(token)
        for token in tokens
    )


def external_url(value: object) -> str | None:
    url = str(value or "").strip()
    return url if urlparse(url).scheme in {"http", "https"} else None


def render_paper(paper: dict[str, object]) -> str:
    parts = [
        '<div class="paper-item">',
        '  <div class="paper-info">',
        "    <p>",
        f'      <span class="paper-title">{html.escape(str(paper.get("title", "")))}</span><br />',
        f'      {formatted_text(paper.get("authors"))}<br />',
        f'      {formatted_text(paper.get("venue"))}<br />',
    ]

    arxiv = external_url(paper.get("arxiv"))
    if arxiv:
        parts.append(
            f'      <a class="badge1 badge-cite" href="{html.escape(arxiv, quote=True)}" '
            'target="_blank" rel="noopener noreferrer"><img '
            'src="images/src_img/arxiv-logo.svg" width="25" loading="lazy" alt="arXiv" /></a>'
        )

    code = external_url(paper.get("code"))
    if code:
        parts.append(
            f'      <a class="badge1 badge-code" href="{html.escape(code, quote=True)}" '
            'target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i> Code</a>'
        )

    scholar = str(paper.get("scholar") or "").strip()
    if scholar:
        parts.append(
            '      <span class="badge1 badge-cite"><i class="fa-brands fa-google-scholar"></i> '
            f'<span class="show_paper_citations" data-paper-id="{html.escape(scholar, quote=True)}"></span></span>'
        )

    parts.extend(["    </p>", "  </div>", "</div>"])
    return "\n".join(parts)


def load_json(filename: str) -> object:
    path = TEMPLATES / "pages" / filename
    return json.loads(path.read_text(encoding="utf-8"))


def render_publication_sections(sections: list[dict[str, object]], selected: bool) -> str:
    output = []
    for section in sections:
        papers = section.get("papers", [])
        if selected:
            papers = [paper for paper in papers if paper.get("selected") != 0]
        if not papers:
            continue
        if not selected:
            year = html.escape(str(section.get("year", "")), quote=True)
            output.append(
                f'<h4 class="subhead" id="year{year}"><i class="fa fa-calendar" '
                f'aria-hidden="true"></i>&nbsp;{year}&nbsp;</h4>'
            )
        output.extend(render_paper(paper) for paper in papers)
    return "\n".join(output)


def render_publications_page(content: str) -> str:
    publications = load_json("publications.json")
    preprints = load_json("preprints.json")
    content = replace_placeholder(
        content,
        SELECTED_PUBLICATIONS_PLACEHOLDER,
        render_publication_sections(publications, selected=True),
    )
    content = replace_placeholder(
        content,
        ALL_PUBLICATIONS_PLACEHOLDER,
        render_publication_sections(publications, selected=False),
    )
    return replace_placeholder(
        content,
        PREPRINTS_PLACEHOLDER,
        "\n".join(render_paper(paper) for paper in preprints),
    )


def render_page_fragments(content: str, directory: str, names: tuple[str, ...]) -> str:
    for name in names:
        placeholder = f"<!-- include: {directory}/{name}.html -->"
        fragment = (TEMPLATES / "pages" / directory / f"{name}.html").read_text(
            encoding="utf-8"
        )
        content = replace_placeholder(content, placeholder, fragment)
    return content


def build_page(filename: str, options: dict[str, str]) -> str:
    layout = Template((TEMPLATES / "layout.html").read_text(encoding="utf-8"))
    header = (TEMPLATES / "partials" / "header.html").read_text(encoding="utf-8")
    content = (TEMPLATES / "pages" / filename).read_text(encoding="utf-8")

    if filename == "index.html":
        content = render_page_fragments(content, "index", ("news",))
    elif filename == "publications.html":
        content = render_publications_page(content)
    elif filename == "lab.html":
        content = render_page_fragments(content, "lab", LAB_TABS)

    content = replace_placeholder(content, HEADER_PLACEHOLDER, header)
    output = layout.substitute(
        title=options.get("title", "Yuezun Li's Homepage"),
    )
    output = replace_placeholder(
        output,
        EXTRA_STYLES_PLACEHOLDER,
        options.get("extra_styles", ""),
    )
    return replace_placeholder(output, CONTENT_PLACEHOLDER, content)


def main() -> None:
    for filename, options in PAGES.items():
        output = build_page(filename, options)
        (ROOT / filename).write_text(output, encoding="utf-8")
        print(f"Built {filename}")


if __name__ == "__main__":
    main()
