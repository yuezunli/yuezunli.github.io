async function loadHTML(id, file) {
  const response = await fetch(file);

  const html = await response.text();

  document.getElementById(id).innerHTML = html;

  /*
  ==========================================
    MENU TOGGLE
  ==========================================
  */

  const toggle = document.querySelector(".nav-toggle");

  const menu = document.querySelector(".nav-menu");

  if (toggle && menu) {
    /*
    ==========================================
      TOGGLE MENU
    ==========================================
    */

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();

      menu.classList.toggle("show");
    });

    /*
    ==========================================
      CLICK MENU: KEEP OPEN
    ==========================================
    */

    menu.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    /*
    ==========================================
      CLICK OUTSIDE: CLOSE MENU
    ==========================================
    */

    document.addEventListener("click", () => {
      menu.classList.remove("show");
    });

    /*
    ==========================================
      CLICK LINK: CLOSE MENU
    ==========================================
    */

    const links = document.querySelectorAll(".nav-menu a");

    links.forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("show");
      });
    });
  }
}

/*
==========================================
  LOAD HEADER
==========================================
*/

loadHTML("site-header", "components/header.html");
