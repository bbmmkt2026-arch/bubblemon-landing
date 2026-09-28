// ADN 3.0(어크로스) 트래커 — 광고주 ID: bubblemon / 광고주명: 위베이프
// 설치 가이드의 jQuery 문법(3-2·4-2)을 이 저장소가 쓰는 바닐라 JS로 옮긴 것이다.
// 전환 버튼은 app.js가 런타임에 그리므로 정적 셀렉터 대신 클릭 위임으로 잡는다.
(function () {
  "use strict";

  var STORE_LINK_SELECTOR =
    'a[href^="https://smartstore.naver.com/bubblemonkorea"]';

  // 두 CTA가 같은 스마트스토어 주소를 쓰므로 링크로는 구분되지 않는다.
  // 하단 고정 띠만 aside로 감싸여 있어 이를 기준으로 가른다.
  var STICKY_SELECTOR = 'aside[aria-label="스마트스토어 구매"]';

  var VISITOR_PARAM = { ut: "Home", ui: "110376" };
  var STICKY_CONVERSION = { ui: "110376", uo: "types2" }; // 지금 구매하기(하단 띠)
  var DEFAULT_CONVERSION = { ui: "110372", uo: "types1" }; // 정품 구매하기(본문)

  // 공통 스크립트가 차단·지연되어도 화면이 깨지지 않게 감싼다.
  function safely(run) {
    try {
      run();
    } catch (error) {
      /* 추적 실패는 사용자 화면에 영향을 주지 않는다 */
    }
  }

  window.addEventListener("load", function () {
    if (typeof window.fnc_adn3_health_ok_check !== "function") return;

    safely(function () {
      window.fnc_adn3_health_ok_check(function () {
        safely(function () {
          var contain = new window.fn_across_adn3_contain();
          contain.init(VISITOR_PARAM);
        });
      });
    });
  });

  document.addEventListener("click", function (event) {
    var origin = event.target;
    var storeLink =
      origin && origin.closest ? origin.closest(STORE_LINK_SELECTOR) : null;

    if (!storeLink) return;
    if (typeof window.fn_across_adn3_btn_ok !== "function") return;

    var conversion = storeLink.closest(STICKY_SELECTOR)
      ? STICKY_CONVERSION
      : DEFAULT_CONVERSION;

    safely(function () {
      window.fn_across_adn3_btn_ok(conversion.ui, conversion.uo);
    });
  });
})();
