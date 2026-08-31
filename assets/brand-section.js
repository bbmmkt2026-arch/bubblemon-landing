(function () {
  "use strict";

  var STORY = [
    {
      title: "익숙한 이름",
      body: "편의점에서 한 번쯤 보셨을 이름, 버블몬입니다."
    },
    {
      title: "위베이프로",
      body: "그 버블몬이 위베이프라는 간판을 걸었습니다."
    },
    {
      title: "전국 484곳",
      body: "매장에서 고객을 만나고 현장의 목소리를 듣습니다."
    },
    {
      title: "그래피티-Ⅲ",
      body: "그렇게 매장에서 시작된 기준을 제품으로 만들었습니다."
    }
  ];

  function create(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function buildBrandSection() {
    var section = create("section", "bbm-brand-section");
    section.id = "brand";
    section.setAttribute("aria-labelledby", "bbm-brand-title");

    var inner = create("div", "bbm-brand-inner");
    var intro = create("div", "bbm-brand-intro");
    var kicker = create("p", "bbm-brand-kicker", "BUBBLEMON × WEVAPE");
    var logos = create("div", "bbm-brand-logos");
    var bubblemon = document.createElement("img");
    bubblemon.src = "./products/bubblemon-logo.webp";
    bubblemon.alt = "BUBBLEMON";
    bubblemon.loading = "lazy";
    var link = create("span", "bbm-brand-link", "×");
    link.setAttribute("aria-hidden", "true");
    var wevape = document.createElement("img");
    wevape.src = "./products/wevape-logo.webp";
    wevape.alt = "WEVAPE";
    wevape.loading = "lazy";
    logos.append(bubblemon, link, wevape);

    var title = create("h2", "", "버블몬이 만든\n위베이프");
    title.id = "bbm-brand-title";
    var lead = create(
      "p",
      "bbm-brand-lead",
      "익숙한 이름에서 시작해, 매장의 목소리를 다시 제품으로 만듭니다."
    );
    var proof = create("div", "bbm-brand-proof");
    proof.append(
      create("strong", "", "484"),
      create("span", "", "전국 위베이프 매장")
    );
    intro.append(kicker, logos, title, lead, proof);

    var list = create("ol", "bbm-brand-steps");
    STORY.forEach(function (item, index) {
      var row = create("li", "bbm-brand-step");
      var number = create("span", "bbm-brand-step-number", String(index + 1).padStart(2, "0"));
      number.setAttribute("aria-hidden", "true");
      var copy = create("div", "bbm-brand-step-copy");
      copy.append(create("h3", "", item.title), create("p", "", item.body));
      row.append(number, copy);
      list.appendChild(row);
    });

    inner.append(intro, list);
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
    }, { threshold: 0.16 });
    observer.observe(section);
  }

  function mount() {
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

    storeTitle.textContent = "주변 위베이프 매장 찾기";
    heading.classList.add("bbm-store-heading");
    if (!heading.querySelector(".bbm-store-lead")) {
      heading.appendChild(create(
        "p",
        "bbm-store-lead",
        "매장명이나 주소를 검색하거나, 현재 위치에서 가까운 매장을 확인하세요."
      ));
    }

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
