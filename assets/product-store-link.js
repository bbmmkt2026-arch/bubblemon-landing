(() => {
  'use strict';

  const destination =
    'https://smartstore.naver.com/bubblemonkorea/products/13658197568' +
    '?utm_source=landing&utm_medium=referral&utm_campaign=graffiti3_v1&utm_content=cta';

  const updateStoreLinks = (root = document) => {
    root.querySelectorAll?.('a[href*="smartstore.naver.com/bubblemonkorea"]').forEach((link) => {
      link.href = destination;
    });
  };

  updateStoreLinks();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches?.('a[href*="smartstore.naver.com/bubblemonkorea"]')) node.href = destination;
        updateStoreLinks(node);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
