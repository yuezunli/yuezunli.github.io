$(document).ready(function () {
  $.getJSON(
    "https://cdn.jsdelivr.net/gh/yuezunli/yuezunli.github.io@google-scholar-stats/gs_data.json",
    function (data) {
      var citationEles = document.getElementsByClassName("low_bound_citations");
      var min_numCitations = 10000000;
      Array.prototype.forEach.call(citationEles, (element) => {
        var paperId = element.getAttribute("data");
        parts = paperId.split(";");
        parts = parts.filter((part) => part.trim() !== "");
        parts.forEach((part, index) => {
          let trimmedPart = part.trim();
          console.log(trimmedPart);
          var numCitations = data["publications"][trimmedPart]["num_citations"];
          console.log(numCitations);
          if (numCitations <= min_numCitations) {
            min_numCitations = numCitations;
          }
        });
        element.innerHTML = Math.floor(min_numCitations / 100) * 100;
      });
    },
  );
});

/* =========================
     Citation 初始化函数
  ========================== */

function loadCitations() {
  $.getJSON(
    "https://cdn.jsdelivr.net/gh/yuezunli/yuezunli.github.io@google-scholar-stats/gs_data.json",

    function (data) {
      var citationEles = document.getElementsByClassName(
        "show_paper_citations",
      );

      Array.prototype.forEach.call(citationEles, (element) => {
        var paperId = element.getAttribute("data");

        try {
          var numCitations = data["publications"][paperId]["num_citations"];
        } catch (err) {
          console.error("Citation Error:", err);
          return;
        }

        element.innerHTML = "Citations: " + numCitations;

        if (numCitations > 100) {
          element.style.color = "red";
        }
      });
    },
  );
}

loadCitations();
