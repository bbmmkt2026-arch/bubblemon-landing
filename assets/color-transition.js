(() => {
  const COLOR_SOURCES = [
    "./products/graffiti3-aurora-gold.webp",
    "./products/graffiti3-gold-rush.webp",
    "./products/graffiti3-sapphire.webp",
    "./products/graffiti3-black.webp",
  ];
  const TRANSITION_MS = 620;

  let mountQueued = false;
  let clearGhostTimer = 0;

  const preloadColors = () => {
    COLOR_SOURCES.forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      image.decode?.().catch(() => {});
    });
  };

  const getMainImage = (product) =>
    [...product.children].find(
      (element) =>
        element instanceof HTMLImageElement &&
        !element.classList.contains("bbm-color-ghost-image"),
    );

  const ensureGhost = (product) => {
    let ghost = product.querySelector(":scope > .bbm-color-ghost");
    if (ghost) return ghost;

    ghost = document.createElement("div");
    ghost.className = "bbm-color-ghost";
    ghost.setAttribute("aria-hidden", "true");

    const image = document.createElement("img");
    image.className = "bbm-color-ghost-image";
    image.alt = "";
    ghost.append(image);
    product.append(ghost);
    return ghost;
  };

  const holdCurrentFrame = (product) => {
    const current = getMainImage(product);
    if (!current) return;

    const ghost = ensureGhost(product);
    const ghostImage = ghost.querySelector("img");
    window.clearTimeout(clearGhostTimer);

    ghost.classList.remove("is-leaving");
    ghostImage.src = current.currentSrc || current.src;
    ghost.classList.add("is-active");
  };

  const revealIncoming = (product, image) => {
    if (!image || image.dataset.bbmColorReady === "true") return;
    image.dataset.bbmColorReady = "true";
    image.classList.add("bbm-color-entering");

    const reveal = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          image.classList.add("is-ready");
          const ghost = product.querySelector(":scope > .bbm-color-ghost");
          if (!ghost) return;

          ghost.classList.add("is-leaving");
          clearGhostTimer = window.setTimeout(() => {
            ghost.classList.remove("is-active", "is-leaving");
            const ghostImage = ghost.querySelector("img");
            if (ghostImage) ghostImage.removeAttribute("src");
          }, TRANSITION_MS);
        });
      });
    };

    if (typeof image.decode === "function") image.decode().catch(() => {}).finally(reveal);
    else reveal();
  };

  const mountColorTransition = () => {
    mountQueued = false;

    const picker = document.querySelector('[role="radiogroup"][aria-label="그래피티 III 색상 선택"]');
    const stage = picker?.parentElement;
    const product = stage?.querySelector('[class*="_colorProduct_"]');
    if (!picker || !stage || !product) return;

    ensureGhost(product);

    if (!picker.dataset.bbmColorClickReady) {
      picker.dataset.bbmColorClickReady = "true";
      picker.addEventListener(
        "click",
        (event) => {
          const button = event.target.closest("button[role='radio']");
          if (!button || button.getAttribute("aria-checked") === "true") return;
          holdCurrentFrame(product);
          button.classList.remove("bbm-color-choice-pulse");
          requestAnimationFrame(() => button.classList.add("bbm-color-choice-pulse"));
        },
        true,
      );
    }

    if (!product.dataset.bbmColorObserverReady) {
      product.dataset.bbmColorObserverReady = "true";
      const observer = new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (
              node instanceof HTMLImageElement &&
              !node.classList.contains("bbm-color-ghost-image")
            ) {
              revealIncoming(product, node);
            }
          });
        });
      });
      observer.observe(product, { childList: true });
    }
  };

  const queueMount = () => {
    if (mountQueued) return;
    mountQueued = true;
    requestAnimationFrame(mountColorTransition);
  };

  preloadColors();
  const rootObserver = new MutationObserver(queueMount);
  rootObserver.observe(document.getElementById("root") || document.body, {
    childList: true,
    subtree: true,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", queueMount, { once: true });
  } else {
    queueMount();
  }
})();
