"use strict";

document.addEventListener("DOMContentLoaded", () => {
  function initializeScrollFade(scrollArea, hint = null) {
    if (!scrollArea) return;

    const updateScrollFade = () => {
      const hasMore =
        scrollArea.scrollHeight - scrollArea.clientHeight - scrollArea.scrollTop > 2;
      scrollArea.classList.toggle("has-more", hasMore);
      if (hint) hint.hidden = !hasMore;
    };

    scrollArea.addEventListener("scroll", updateScrollFade, { passive: true });
    window.addEventListener("resize", updateScrollFade);
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateScrollFade);
      observer.observe(scrollArea);
      Array.from(scrollArea.children).forEach((child) => observer.observe(child));
    }
    if (document.fonts) document.fonts.ready.then(updateScrollFade);
    updateScrollFade();
  }

  initializeScrollFade(
    document.querySelector(".alumni-scroll"),
    document.querySelector(".alumni-scroll-hint"),
  );
  initializeScrollFade(document.querySelector(".home-news-list"));

  const currentPage =
    new URL(window.location.href).pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-menu a").forEach((link) => {
    const linkPage = new URL(link.href, window.location.href).pathname
      .split("/")
      .pop();

    const isCurrentPage = linkPage === currentPage;
    link.classList.toggle("active", isCurrentPage);
    if (isCurrentPage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
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
