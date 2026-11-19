# Yuezun Li's Homepage

This is a statically generated website. Edit shared markup in
`templates/layout.html` and `templates/partials/header.html`, and edit page
content in `templates/pages/`.

Publication data is stored in `templates/pages/publications.json` and
`templates/pages/preprints.json`. The build embeds it directly in
`publications.html`; the browser does not request these JSON files.

Each accepted publication has an official `link`, a venue/year `tag`, and one
`area`: `Multimedia Forensics`, `Model Security`, or `Visual Analysis`.
Use A/B suffixes for papers at the same venue in the same year, following their
JSON order. The build displays tags and linked titles in the publication lists
and groups all publication tags by area on the Research page (`research.html`).

The Lab page is split by tab. Edit the individual fragments under
`templates/pages/lab/`; `build.py` combines them into the generated `lab.html`.

Homepage news is maintained in `templates/pages/index/news.html` and embedded
in `index.html` during the build.

Format the editable HTML templates with Prettier:

```bash
npx prettier --write "templates/**/*.html"
```

Each page template is valid, balanced HTML. The
`<!-- include: partials/header.html -->` comment marks where the shared header
is inserted during the build.

Generate the deployable HTML files with:

```bash
python3 build.py
```

The generated root-level HTML files are the files served by GitHub Pages.
Do not edit their shared header or layout directly because the next build will
replace those changes.
