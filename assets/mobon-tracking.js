(function () {
  "use strict";

  var STORE_LINK_SELECTOR =
    'a[href^="https://smartstore.naver.com/bubblemonkorea"]';

  window.CallMtm =
    window.CallMtm ||
    function () {
      (window.CallMtm.q = window.CallMtm.q || []).push(arguments);
    };

  document.addEventListener("click", function (event) {
    var origin = event.target;
    var storeLink =
      origin && origin.closest ? origin.closest(STORE_LINK_SELECTOR) : null;

    if (!storeLink) return;

    window.CallMtm({
      productName: "스토어 보기",
      convType: "etc"
    });
  });
})();
