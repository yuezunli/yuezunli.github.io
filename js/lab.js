async function loadHTML(id, file) {
  const response = await fetch(file);

  const html = await response.text();

  document.getElementById(id).innerHTML = html;
}

/*
==========================================
  LOAD COMPONENTS
==========================================
*/

loadHTML("site-lab-collab", "components/lab-collab.html");
loadHTML("site-lab-member", "components/lab-member.html");
loadHTML("site-lab-alumni", "components/lab-alumni.html");
loadHTML("site-lab-photo", "components/lab-photo.html");
loadHTML("site-lab-codebase", "components/lab-codebase.html");
