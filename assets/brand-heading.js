(function () {
  "use strict";

  // The brand title lives outside React so it remains readable before scripts load.
  // Keep the featured product heading beneath that document-level title.
  function updateProductHeading() {
    var heading = document.querySelector("#root #top h1");
    if (!heading) return false;
    var replacement = document.createElement("h2");
    replacement.className = "bbm-product-heading";
    replacement.textContent = heading.textContent;
    heading.replaceWith(replacement);
    return true;
  }

  if (!document.getElementById("bbm-home-title") || updateProductHeading()) return;
  var root = document.getElementById("root");
  if (!root) return;
  var observer = new MutationObserver(function () {
    if (!updateProductHeading()) return;
    observer.disconnect();
  });
  observer.observe(root, { childList: true, subtree: true });
  window.setTimeout(function () { observer.disconnect(); }, 20000);
})();
