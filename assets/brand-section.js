(function () {
  "use strict";

  function create(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function updateBrandLogos() {
    var headerLogo = document.querySelector('header a[href="#top"] img');
    if (headerLogo) {
      headerLogo.src = "/products/bubblemon-logo.webp";
      headerLogo.alt = "버블몬 BUBBLEMON";
    }

    document.querySelectorAll('img[src*="bubblemon-logo.webp"]').forEach(function (logo) {
      logo.alt = "버블몬 BUBBLEMON";
    });
  }

  function buildBrandSection() {
    var section = create("section", "bbm-brand-section");
    section.id = "brand";
    section.setAttribute("aria-labelledby", "bbm-brand-title");

    var inner = create("div", "bbm-brand-inner");
    var intro = create("div", "bbm-brand-intro");
    var title = create("h2", "", "매장을 만든 경험으로,\n디바이스의 기준을 만듭니다.");
    title.id = "bbm-brand-title";
    var lead = create(
      "p",
      "bbm-brand-lead",
      "편의점에서 익숙했던 버블몬. 전국 484개 위베이프 매장에서 쌓은 경험을 그래피티-Ⅲ에 담았습니다."
    );
    intro.append(title, lead);
    inner.appendChild(intro);
    section.appendChild(inner);
    return section;
  }

  function reveal(section) {
    if (!("IntersectionObserver" in window)) {
      section.classList.add("is-visible");
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        section.classList.add("is-visible");
        observer.disconnect();
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -10%" });
    observer.observe(section);
  }

  function mount() {
    updateBrandLogos();

    var stores = document.getElementById("stores");
    if (!stores || stores.dataset.brandSplit === "true") return Boolean(stores);

    var storeTitle = stores.querySelector("#store-finder-title");
    var heading = storeTitle && storeTitle.parentElement;
    if (!heading || !stores.parentNode) return false;

    var oldStory = heading.querySelector(".bbm-story");
    if (oldStory) {
      oldStory.hidden = true;
      oldStory.setAttribute("aria-hidden", "true");
    }

    storeTitle.textContent = "주변 버블몬 매장 찾기";
    heading.classList.add("bbm-store-heading");
    heading.hidden = true;
    heading.setAttribute("aria-hidden", "true");
    var storeLead = heading.querySelector(".bbm-store-lead");
    if (storeLead) storeLead.remove();

    var brand = buildBrandSection();
    stores.parentNode.insertBefore(brand, stores);
    stores.dataset.brandSplit = "true";
    reveal(brand);
    return true;
  }

  if (!mount()) {
    var root = document.getElementById("root");
    var observer = new MutationObserver(function () {
      if (!mount()) return;
      observer.disconnect();
    });
    observer.observe(root || document.documentElement, { childList: true, subtree: true });
    window.setTimeout(function () { observer.disconnect(); }, 20000);
  }
})();
