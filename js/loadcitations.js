"use strict";

const SCHOLAR_DATA_URL =
  "https://cdn.jsdelivr.net/gh/yuezunli/yuezunli.github.io@google-scholar-stats/gs_data.json";

let scholarDataRequest;

function fetchScholarData() {
  if (!scholarDataRequest) {
    scholarDataRequest = fetch(SCHOLAR_DATA_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`Citation request failed: HTTP ${response.status}`);
      }

      return response.json();
    });
  }

  return scholarDataRequest;
}

function getCitationCount(data, paperId) {
  return data.publications?.[paperId]?.num_citations;
}

async function loadCitationLowerBounds() {
  const elements = document.querySelectorAll(".low_bound_citations");

  if (elements.length === 0) {
    return;
  }

  try {
    const data = await fetchScholarData();

    elements.forEach((element) => {
      const counts = (element.dataset.paperIds || element.getAttribute("data") || "")
        .split(";")
        .map((paperId) => paperId.trim())
        .filter(Boolean)
        .map((paperId) => getCitationCount(data, paperId))
        .filter(Number.isFinite);

      if (counts.length > 0) {
        element.textContent = String(Math.floor(Math.min(...counts) / 100) * 100);
      }
    });
  } catch (error) {
    console.error("Failed to load citation lower bounds.", error);
  }
}

async function loadCitations() {
  const elements = document.querySelectorAll(".show_paper_citations");

  if (elements.length === 0) {
    return;
  }

  try {
    const data = await fetchScholarData();

    elements.forEach((element) => {
      const paperId = element.dataset.paperId || element.getAttribute("data");
      const citationCount = getCitationCount(data, paperId);

      if (!Number.isFinite(citationCount)) {
        return;
      }

      element.textContent = `Citations: ${citationCount}`;
      element.classList.toggle("high-citation-count", citationCount > 100);
    });
  } catch (error) {
    console.error("Failed to load paper citations.", error);
  }
}

document.addEventListener("DOMContentLoaded", loadCitationLowerBounds);
