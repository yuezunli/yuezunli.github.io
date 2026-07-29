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
 * 添加只允许 <b> 和 <sup> 的格式化文本。
 * 其他标签会作为普通文本显示。
 */
function appendFormattedText(parent, value) {
  const tokens = String(value ?? "").split(/(<\/?(?:b|sup)>)/gi);
  const elementStack = [parent];

  tokens.forEach((token) => {
    const normalizedToken = token.toLowerCase();

    if (normalizedToken === "<b>" || normalizedToken === "<sup>") {
      const tagName = normalizedToken.slice(1, -1);
      const element = document.createElement(tagName);

      elementStack[elementStack.length - 1].appendChild(element);
      elementStack.push(element);
      return;
    }

    if (normalizedToken === "</b>" || normalizedToken === "</sup>") {
      if (elementStack.length > 1) {
        elementStack.pop();
      }
      return;
    }

    elementStack[elementStack.length - 1].appendChild(
      document.createTextNode(token),
    );
  });
}

function appendLineBreak(parent) {
  parent.appendChild(document.createElement("br"));
}

function createExternalLink(url, className, label) {
  let parsedUrl;

  try {
    parsedUrl = new URL(url, window.location.href);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return null;
  }

  const link = document.createElement("a");

  link.className = className;
  link.href = parsedUrl.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  if (label) {
    link.append(label);
  }

  return link;
}

/**
 * 根据论文数据创建论文 DOM 元素。
 */
function createPaperElement(paperData) {
  const paper = document.createElement("div");
  const paperInfo = document.createElement("div");
  const content = document.createElement("p");
  const title = document.createElement("span");

  paper.className = "paper-item";
  paperInfo.className = "paper-info";
  title.className = "paper-title";
  title.textContent = paperData.title;
  content.appendChild(title);

  appendLineBreak(content);
  appendFormattedText(content, paperData.authors);
  appendLineBreak(content);
  appendFormattedText(content, paperData.venue);
  appendLineBreak(content);

  if (paperData.arxiv) {
    const arxivLink = createExternalLink(
      paperData.arxiv,
      "badge1 badge-cite",
    );
    const arxivLogo = document.createElement("img");

    arxivLogo.src = "images/src_img/arxiv-logo.svg";
    arxivLogo.width = 25;
    arxivLogo.loading = "lazy";
    arxivLogo.alt = "arXiv";
    if (arxivLink) {
      arxivLink.appendChild(arxivLogo);
      content.appendChild(arxivLink);
    }
  }

  if (paperData.code) {
    const codeLink = createExternalLink(
      paperData.code,
      "badge1 badge-code",
    );
    if (codeLink) {
      const githubIcon = document.createElement("i");

      githubIcon.className = "fa-brands fa-github";
      codeLink.append(githubIcon, " Code");
      content.appendChild(codeLink);
    }
  }

  if (paperData.scholar) {
    const citationBadge = document.createElement("span");
    const scholarIcon = document.createElement("i");
    const citationCount = document.createElement("span");

    citationBadge.className = "badge1 badge-cite";
    scholarIcon.className = "fa-brands fa-google-scholar";
    citationCount.className = "show_paper_citations";
    citationCount.dataset.paperId = paperData.scholar;
    citationBadge.append(scholarIcon, " ", citationCount);
    content.appendChild(citationBadge);
  }

  paperInfo.appendChild(content);
  paper.appendChild(paperInfo);

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

          const calendarIcon = document.createElement("i");

          calendarIcon.className = "fa fa-calendar";
          calendarIcon.setAttribute("aria-hidden", "true");
          yearTitle.append(calendarIcon, `\u00a0${section.year}\u00a0`);

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
