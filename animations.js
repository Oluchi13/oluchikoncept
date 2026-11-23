// Scroll-triggered image reveals. Cards are rendered by app.js (and re-rendered on filter),
// so a MutationObserver watches the grid and animates whatever appears.
(function () {
  window.__animReady = true;
  const root = document.documentElement;
  if (!root.classList.contains("anim")) return;

  let queue = 0, timer = null;
  const io = new IntersectionObserver((entries) => {
    entries.filter(e => e.isIntersecting).forEach((entry) => {
      // Stagger items that enter together, e.g. one row of cards.
      entry.target.style.setProperty("--d", (queue++ * 0.12).toFixed(2) + "s");
      entry.target.classList.add("in-view");
      io.unobserve(entry.target);
    });
    clearTimeout(timer);
    timer = setTimeout(() => { queue = 0; }, 400);
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });

  const watch = (scope) => scope.querySelectorAll(".portfolio-card:not(.in-view), .about-portrait:not(.in-view)").forEach(el => io.observe(el));

  watch(document);
  const grid = document.getElementById("portfolioGrid");
  if (grid) new MutationObserver(() => watch(grid)).observe(grid, { childList: true });
})();
