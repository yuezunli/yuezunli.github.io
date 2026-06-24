function loadPublications(id) {
  const container = document.getElementById(id);

  const jsonPath = container.dataset.json;
  const mode = container.dataset.mode;

  fetch(jsonPath)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return res.json();
    })

    .then((data) => {
      // const container = document.getElementById("papers-container");

      data.forEach((section) => {
        /* ===== 年份标题 ===== */
        const yearTitle = document.createElement("h4");
        yearTitle.className = "subhead";
        yearTitle.id = `year${section.year}`;

        yearTitle.innerHTML = `
        <i class="fa fa-calendar" aria-hidden="true"></i>
        &nbsp;${section.year}&nbsp;
      `;

        if (mode != "selected") {
          container.appendChild(yearTitle);
        }

        /* ===== 论文 ===== */
        section.papers
          .filter((p) => !(mode === "selected" && p.selected === 0))
          .forEach((p) => {
            const paper = document.createElement("div");
            paper.className = "paper-item";

            paper.innerHTML = `
          <div class="paper-image">
            <div class="img-box">
              <img src="${p.image}" alt="${p.title}" />
            </div>
          </div>

          <div class="paper-info">
            <p>

              <a href="${p.paper || "#"}" target="_blank">

                <papertitle>
                  ${p.title}
                </papertitle>

              </a>

              <br />

              ${p.authors}

              <br />
              
              ${p.venue}

              <br />

              ${
                p.code
                  ? `
                <a
                  class="badge1 badge-code"
                  href="${p.code}"
                  target="_blank"
                >
                  <i class="fa-brands fa-github"></i>
                  Code
                </a>
              `
                  : ""
              }

              ${
                p.scholar
                  ? `
                <span class="badge1 badge-cite">
                  <i class="fa-brands fa-google-scholar"></i>

                  <span
                    class="show_paper_citations"
                    data="${p.scholar}"
                  ></span>

                </span>
              `
                  : ""
              }

            </p>
          </div>
        `;

            container.appendChild(paper);
          });
      });
      /* =========================
         关键：
         DOM插入完后再加载citation
      ========================== */

      loadCitations();
    })

    .catch((err) => {
      console.error("Failed to load publications.json");
      console.error(err);
    });
}

loadPublications("papers-container");
loadPublications("papers-selected");

function loadpreprints(id) {
  const container = document.getElementById(id);

  const jsonPath = container.dataset.json;
  const mode = container.dataset.mode;

  fetch(jsonPath)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return res.json();
    })

    .then((data) => {
      /* ===== 可选：按年份从新到旧排序 ===== */
      data.sort((a, b) => {
        const getYear = (x) =>
          parseInt(x.venue.match(/\b(20\d{2})\b/)?.[1] || 0);
        return getYear(b) - getYear(a);
      });

      /* ===== 直接渲染（无 section） ===== */
      data.forEach((p) => {
        const paper = document.createElement("div");
        paper.className = "paper-item";

        paper.innerHTML = `
          <div class="paper-image">
            <div class="img-box">
              <img src="${p.image}" alt="${p.title}" />
            </div>
          </div>

          <div class="paper-info">
            <p>

              <a href="${p.link || "#"}" target="_blank">

                <papertitle>
                  ${p.title}
                </papertitle>

              </a>

              <br />

              ${p.authors}

              <br />

              ${p.venue}

              <br />

              ${
                p.code
                  ? `
                <a
                  class="badge1 badge-code"
                  href="${p.code}"
                  target="_blank"
                >
                  <i class="fa-brands fa-github"></i>
                  Code
                </a>
              `
                  : ""
              }

              ${
                p.scholar
                  ? `
                <span class="badge1 badge-cite">
                  <i class="fa-brands fa-google-scholar"></i>

                  <span
                    class="show_paper_citations"
                    data="${p.scholar}"
                  ></span>

                </span>
              `
                  : ""
              }

            </p>
          </div>
        `;

        container.appendChild(paper);
      });
      /* =========================
         关键：
         DOM插入完后再加载citation
      ========================== */

      loadCitations();
    })

    .catch((err) => {
      console.error("Failed to load publications.json");
      console.error(err);
    });
}

loadpreprints("papers-preprints");
