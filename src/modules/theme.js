document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("theme-toggle");
  if (!themeBtn) return;

  const storageKey = "ui-theme";

  const applyTheme = (theme) => {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-ui", isDark);
    document.documentElement.setAttribute("data-theme", theme);

    themeBtn.setAttribute("aria-pressed", String(!isDark));

    try {
      localStorage.setItem(storageKey, theme);
    } catch (_) {}
  };

  let savedTheme = "dark";
  try {
    savedTheme = localStorage.getItem(storageKey) || "dark";
  } catch (_) {}

  applyTheme(savedTheme);

  themeBtn.addEventListener("click", () => {
    const isDarkNow = document.body.classList.contains("dark-ui");
    applyTheme(isDarkNow ? "light" : "dark");
  });
});

(function enableOptionalCustomCursorMode() {
  const prefersFinePointer =
    window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (
    prefersFinePointer &&
    !prefersReducedMotion &&
    document.querySelector(".custom-cursor")
  ) {
    document.documentElement.classList.add("custom-cursor-enabled");
  }
})();

function typeWriter(text, element, speed = 80) {
  let i = 0;
  element.innerHTML = "";

  function typing() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }

  typing();
}

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("typed-text");
  if (el) {
    typeWriter("Xoş gəldin, Cəmaləm ❤️", el, 70);
  }
});
