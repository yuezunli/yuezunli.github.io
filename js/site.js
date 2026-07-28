"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const currentPage =
    new URL(window.location.href).pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-menu a").forEach((link) => {
    const linkPage = new URL(link.href, window.location.href).pathname
      .split("/")
      .pop();

    link.classList.toggle("active", linkPage === currentPage);
  });

  const toggleButton = document.querySelector(".nav-toggle");
  const navigation = document.querySelector(".nav-menu");

  if (toggleButton && navigation) {
    toggleButton.setAttribute("aria-expanded", "false");

    const closeNavigation = () => {
      navigation.classList.remove("show");
      toggleButton.setAttribute("aria-expanded", "false");
    };

    toggleButton.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("show");
      toggleButton.setAttribute("aria-expanded", String(isOpen));
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeNavigation();
      }
    });

    document.addEventListener("click", (event) => {
      const clickedInsideNavigation = navigation.contains(event.target);
      const clickedToggleButton = toggleButton.contains(event.target);

      if (!clickedInsideNavigation && !clickedToggleButton) {
        closeNavigation();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeNavigation();
        toggleButton.focus();
      }
    });
  }
});
