"""Build the static website from shared templates."""

import re
from pathlib import Path
from string import Template
from textwrap import dedent

ROOT = Path(__file__).parent
TEMPLATES = ROOT / "templates"
HEADER_PLACEHOLDER = "<!-- include: partials/header.html -->"
EXTRA_STYLES_PLACEHOLDER = "<!-- include: extra-styles -->"
CONTENT_PLACEHOLDER = "<!-- include: page-content -->"

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


def build_page(filename: str, options: dict[str, str]) -> str:
    layout = Template((TEMPLATES / "layout.html").read_text(encoding="utf-8"))
    header = (TEMPLATES / "partials" / "header.html").read_text(encoding="utf-8")
    content = (TEMPLATES / "pages" / filename).read_text(encoding="utf-8")

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
