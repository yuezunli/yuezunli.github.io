/*
==========================================
  AVOID DUPLICATE JSON REQUESTS
==========================================
*/

const jsonRequests = new Map();

/**
 * 请求 JSON 数据。
 * 同一页面中，相同路径只发送一次 fetch 请求。
 */
function fetchJSON(jsonPath) {
  if (jsonRequests.has(jsonPath)) {
    return jsonRequests.get(jsonPath);
  }

  const request = fetch(jsonPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${jsonPath}: HTTP ${response.status}`);
      }

      return response.json();
    })
    .catch((error) => {
      /*
       * 请求失败后删除记录，
       * 允许之后重新请求。
       */
      jsonRequests.delete(jsonPath);

      throw error;
    });

  jsonRequests.set(jsonPath, request);

  return request;
}

/*
==========================================
  CREATE PAPER ELEMENT
==========================================
*/

/**
 * 根据论文数据创建论文 DOM 元素。
 */
function createPaperElement(p) {
  const paper = document.createElement("div");

  paper.className = "paper-item";

  paper.innerHTML = `
    <div class="paper-info">
      <p>
        <papertitle>
          ${p.title}
        </papertitle>

        <br />

        ${p.authors}

        <br />

        ${p.venue}

        <br />

        ${
          p.arxiv
            ? `
              <a
                class="badge1 badge-cite"
                href="${p.arxiv}"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="images/src_img/arxiv-logo.svg"
                  width="25px"
                  loading="lazy"
                  alt="arXiv"
                />
              </a>
            `
            : ""
        }

        ${
          p.code
            ? `
              <a
                class="badge1 badge-code"
                href="${p.code}"
                target="_blank"
                rel="noopener noreferrer"
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

  return paper;
}

/*
==========================================
  LOAD PUBLICATIONS
==========================================
*/

/**
 * 加载正式发表论文。
 *
 * 支持：
 * 1. All publications
 * 2. Selected publications
 */
function loadPublications(id) {
  const container = document.getElementById(id);

  /*
   * 当前页面没有该容器时直接结束。
   */
  if (!container) {
    return Promise.resolve();
  }

  const jsonPath = container.dataset.json;
  const mode = container.dataset.mode;

  if (!jsonPath) {
    console.error(`Missing data-json attribute on #${id}`);

    return Promise.resolve();
  }

  /*
   * 防止同一个容器被重复加载。
   */
  if (container.dataset.loaded === "true") {
    return Promise.resolve();
  }

  return fetchJSON(jsonPath)
    .then((data) => {
      const fragment = document.createDocumentFragment();

      data.forEach((section) => {
        /*
        ==========================================
          FILTER PAPERS
        ==========================================
        */

        const papers = section.papers.filter((p) => {
          return !(mode === "selected" && p.selected === 0);
        });

        /*
         * 当前年份没有符合条件的论文时跳过。
         */
        if (papers.length === 0) {
          return;
        }

        /*
        ==========================================
          YEAR TITLE
        ==========================================
        */

        if (mode !== "selected") {
          const yearTitle = document.createElement("h4");

          yearTitle.className = "subhead";
          yearTitle.id = `year${section.year}`;

          yearTitle.innerHTML = `
            <i
              class="fa fa-calendar"
              aria-hidden="true"
            ></i>
            &nbsp;${section.year}&nbsp;
          `;

          fragment.appendChild(yearTitle);
        }

        /*
        ==========================================
          PAPER ITEMS
        ==========================================
        */

        papers.forEach((p) => {
          fragment.appendChild(createPaperElement(p));
        });
      });

      container.appendChild(fragment);
      container.dataset.loaded = "true";
    })
    .catch((error) => {
      console.error(`Failed to load publications from ${jsonPath}`);
      console.error(error);
    });
}

/*
==========================================
  LOAD PREPRINTS
==========================================
*/

/**
 * 加载预印本。
 * 完全按照 JSON 文件中的原始顺序显示。
 */
function loadPreprints(id) {
  const container = document.getElementById(id);

  if (!container) {
    return Promise.resolve();
  }

  const jsonPath = container.dataset.json;

  if (!jsonPath) {
    console.error(`Missing data-json attribute on #${id}`);

    return Promise.resolve();
  }

  /*
   * 防止同一个容器被重复加载。
   */
  if (container.dataset.loaded === "true") {
    return Promise.resolve();
  }

  return fetchJSON(jsonPath)
    .then((data) => {
      const fragment = document.createDocumentFragment();

      /*
       * 直接按照 JSON 中的顺序渲染。
       */
      data.forEach((p) => {
        fragment.appendChild(createPaperElement(p));
      });

      container.appendChild(fragment);
      container.dataset.loaded = "true";
    })
    .catch((error) => {
      console.error(`Failed to load preprints from ${jsonPath}`);
      console.error(error);
    });
}

/*
==========================================
  INITIALIZE PUBLICATIONS
==========================================
*/

/**
 * 同时加载：
 *
 * 1. All publications
 * 2. Selected publications
 * 3. Preprints
 *
 * 全部加载完成后，只调用一次 loadCitations()。
 */
function initializePublications() {
  Promise.all([
    loadPublications("papers-container"),
    loadPublications("papers-selected"),
    loadPreprints("papers-preprints"),
  ])
    .then(() => {
      if (typeof loadCitations === "function") {
        loadCitations();
      }
    })
    .catch((error) => {
      console.error("Failed to initialize publications.");
      console.error(error);
    });
}

/*
==========================================
  START
==========================================
*/

initializePublications();

// function loadPublications(id) {
//   const container = document.getElementById(id);

//   const jsonPath = container.dataset.json;
//   const mode = container.dataset.mode;

//   // fetch(jsonPath)
//   //   .then((res) => {
//   //     if (!res.ok) {
//   //       throw new Error(`HTTP Error: ${res.status}`);
//   //     }
//   //     return res.json();
//   //   })
//   const cached = sessionStorage.getItem("publicationsData");

//   (cached
//     ? Promise.resolve(JSON.parse(cached))
//     : fetch(jsonPath).then((r) => r.json())
//   )
//     .then((data) => {
//       // const container = document.getElementById("papers-container");

//       data.forEach((section) => {
//         /* ===== 年份标题 ===== */
//         const yearTitle = document.createElement("h4");
//         yearTitle.className = "subhead";
//         yearTitle.id = `year${section.year}`;

//         yearTitle.innerHTML = `
//         <i class="fa fa-calendar" aria-hidden="true"></i>
//         &nbsp;${section.year}&nbsp;
//       `;

//         if (mode != "selected") {
//           container.appendChild(yearTitle);
//         }

//         /* ===== 论文 ===== */
//         section.papers
//           .filter((p) => !(mode === "selected" && p.selected === 0))
//           .forEach((p) => {
//             const paper = document.createElement("div");
//             paper.className = "paper-item";

//             paper.innerHTML = `

//           <div class="paper-info">
//             <p>
//             <papertitle>
//                   ${p.title}
//                 </papertitle>

//               <br />

//               ${p.authors}

//               <br />

//               ${p.venue}

//               <br />

//               ${
//                 p.arxiv
//                   ? `
//                 <a
//                   class="badge1 badge-cite"
//                   href="${p.arxiv}"
//                   target="_blank"
//                 >
//                   <img src="images/src_img/arxiv-logo.svg" width="25px" loading="lazy" />
//                 </a>
//               `
//                   : ""
//               }

//               ${
//                 p.code
//                   ? `
//                 <a
//                   class="badge1 badge-code"
//                   href="${p.code}"
//                   target="_blank"
//                 >
//                   <i class="fa-brands fa-github"></i>
//                   Code
//                 </a>
//               `
//                   : ""
//               }

//               ${
//                 p.scholar
//                   ? `
//                 <span class="badge1 badge-cite">
//                   <i class="fa-brands fa-google-scholar"></i>

//                   <span
//                     class="show_paper_citations"
//                     data="${p.scholar}"
//                   ></span>

//                 </span>
//               `
//                   : ""
//               }

//             </p>
//           </div>
//         `;

//             container.appendChild(paper);
//           });
//       });
//       /* =========================
//          关键：
//          DOM插入完后再加载citation
//       ========================== */

//       loadCitations();
//     })

//     .catch((err) => {
//       console.error("Failed to load publications.json");
//       console.error(err);
//     });
// }

// loadPublications("papers-container");
// loadPublications("papers-selected");

// function loadpreprints(id) {
//   const container = document.getElementById(id);

//   const jsonPath = container.dataset.json;
//   const mode = container.dataset.mode;

//   // fetch(jsonPath)
//   //   .then((res) => {
//   //     if (!res.ok) {
//   //       throw new Error(`HTTP Error: ${res.status}`);
//   //     }
//   //     return res.json();
//   //   })
//   const cached = sessionStorage.getItem("preprintsData");

//   (cached
//     ? Promise.resolve(JSON.parse(cached))
//     : fetch(jsonPath).then((r) => r.json())
//   )

//     .then((data) => {
//       /* ===== 可选：按年份从新到旧排序 ===== */
//       data.sort((a, b) => {
//         const getYear = (x) =>
//           parseInt(x.venue.match(/\b(20\d{2})\b/)?.[1] || 0);
//         return getYear(b) - getYear(a);
//       });

//       /* ===== 直接渲染（无 section） ===== */
//       data.forEach((p) => {
//         const paper = document.createElement("div");
//         paper.className = "paper-item";

//         paper.innerHTML = `

//           <div class="paper-info">
//             <p>
//                 <papertitle>
//                   ${p.title}
//                 </papertitle>

//               <br />

//               ${p.authors}

//               <br />

//               ${p.venue}

//               <br />

//               ${
//                 p.arxiv
//                   ? `
//                 <a
//                   class="badge1 badge-cite"
//                   href="${p.arxiv}"
//                   target="_blank"
//                 >
//                   <img src="images/src_img/arxiv-logo.svg" width="25px" loading="lazy" />
//                 </a>
//               `
//                   : ""
//               }
//               ${
//                 p.code
//                   ? `
//                 <a
//                   class="badge1 badge-code"
//                   href="${p.code}"
//                   target="_blank"
//                 >
//                   <i class="fa-brands fa-github"></i>
//                   Code
//                 </a>
//               `
//                   : ""
//               }

//               ${
//                 p.scholar
//                   ? `
//                 <span class="badge1 badge-cite">
//                   <i class="fa-brands fa-google-scholar"></i>

//                   <span
//                     class="show_paper_citations"
//                     data="${p.scholar}"
//                   ></span>

//                 </span>
//               `
//                   : ""
//               }

//             </p>
//           </div>
//         `;

//         container.appendChild(paper);
//       });
//       /* =========================
//          关键：
//          DOM插入完后再加载citation
//       ========================== */

//       loadCitations();
//     })

//     .catch((err) => {
//       console.error("Failed to load publications.json");
//       console.error(err);
//     });
// }

// loadpreprints("papers-preprints");
