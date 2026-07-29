"""Build the static website from shared templates."""

from pathlib import Path
from string import Template

ROOT = Path(__file__).parent
TEMPLATES = ROOT / "templates"

PAGES = {
    "index.html": {},
    "publications.html": {},
    "funds.html": {},
    "services.html": {},
    "talks.html": {},
    "lab.html": {"extra_styles": '    <link href="css/lab.css" rel="stylesheet" />'},
}


def indent_fragment(fragment: str, spaces: int) -> str:
    indentation = " " * spaces
    return "\n".join(
        f"{indentation}{line}" if line else ""
        for line in fragment.strip().splitlines()
    )


def build_page(filename: str, options: dict[str, str]) -> str:
    layout = Template((TEMPLATES / "layout.html").read_text(encoding="utf-8"))
    header = (TEMPLATES / "partials" / "header.html").read_text(encoding="utf-8")
    content = (TEMPLATES / "pages" / filename).read_text(encoding="utf-8")

    return layout.substitute(
        title=options.get("title", "Yuezun Li's Homepage"),
        extra_styles=options.get("extra_styles", ""),
        header=header.rstrip(),
        content=indent_fragment(content, 0),
    )


def main() -> None:
    for filename, options in PAGES.items():
        output = build_page(filename, options)
        (ROOT / filename).write_text(output, encoding="utf-8")
        print(f"Built {filename}")


if __name__ == "__main__":
    main()
