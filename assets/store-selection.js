(() => {
  let mountQueued = false;

  const selectStoreOnMap = (link) => {
    const target = link.closest("article, tr");
    if (!target) return;
    target.click();
  };

  const wireStoreLinks = () => {
    mountQueued = false;
    const stores = document.querySelector("#stores");
    if (!stores) return;

    stores
      .querySelectorAll('a[href*="map.naver.com"], a[href*="place.naver.com"]')
      .forEach((link) => {
        if (link.dataset.bbmStoreSelectReady === "true") return;

        const card = link.closest("article");
        const row = link.closest("tr");
        const storeName =
          card?.querySelector("h3")?.textContent?.trim() ||
          row?.querySelector("strong")?.textContent?.trim() ||
          "선택한 매장";

        link.dataset.bbmStoreSelectReady = "true";
        link.href = "#stores";
        link.removeAttribute("target");
        link.removeAttribute("rel");
        link.setAttribute("role", "button");
        link.setAttribute("aria-label", `${storeName} 지도에 표시`);

        if (link.textContent.trim()) link.textContent = "지도에 표시";

        link.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            event.stopPropagation();
            selectStoreOnMap(link);
          },
          true,
        );
      });
  };

  const queueMount = () => {
    if (mountQueued) return;
    mountQueued = true;
    requestAnimationFrame(wireStoreLinks);
  };

  const observer = new MutationObserver(queueMount);
  observer.observe(document.getElementById("root") || document.body, {
    childList: true,
    subtree: true,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", queueMount, { once: true });
  } else {
    queueMount();
  }
})();
