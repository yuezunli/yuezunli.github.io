# Yuezun Li's Homepage

This is a statically generated website. Edit shared markup in
`templates/layout.html` and `templates/partials/header.html`, and edit page
content in `templates/pages/`.

Generate the deployable HTML files with:

```bash
python3 build.py
```

The generated root-level HTML files are the files served by GitHub Pages.
Do not edit their shared header or layout directly because the next build will
replace those changes.
