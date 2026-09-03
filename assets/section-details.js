(function () {
  "use strict";

  var sections = [
    {
      heading: "#core-title",
      text: "출력, 배터리, 충전과 소재의 차이를 실제 사용 편의로 연결했습니다. 매일 손에 닿는 경험이 더 편안하도록 완성한 디바이스, 버블몬 Graffiti-III입니다."
    },
    {
      heading: "#color-title",
      text: "빛과 각도에 따라 서로 다른 표정을 보여주는 네 가지 컬러를 준비했습니다. 오로라 골드, 골드 러쉬, 사파이어 블루, 블랙 중 나에게 맞는 버블몬 Graffiti-III를 선택할 수 있습니다."
    },
    {
      heading: "#control-title",
      text: "전원, 출력 조절, 잠금 기능을 한 버튼에 모아 버블몬 Graffiti-III를 간편하게 사용할 수 있습니다. 후면 에어플로를 조절해 원하는 흡입감까지 내 방식에 맞출 수 있습니다.",
      variant: "wide"
    },
    {
      heading: "#buy h2",
      text: "별빛 그래픽과 메탈 바디가 버블몬만의 시그니처를 완성합니다. 버블몬 Graffiti-III의 제품 정보와 정품 구매 경로는 공식 스토어에서 확인할 수 있습니다.",
      variant: "center"
    }
  ];

  var mountQueued = false;

  function addDetail(item) {
    var heading = document.querySelector(item.heading);
    if (!heading || heading.parentElement.querySelector('[data-bbm-section-detail="' + item.heading + '"]')) return;

    var detail = document.createElement("p");
    detail.className = "bbm-section-detail" + (item.variant ? " bbm-section-detail--" + item.variant : "");
    detail.dataset.bbmSectionDetail = item.heading;

    var text = document.createElement("span");
    text.textContent = item.text;
    detail.appendChild(text);
    heading.insertAdjacentElement("afterend", detail);
  }

  function mount() {
    mountQueued = false;
    sections.forEach(addDetail);
  }

  function queueMount() {
    if (mountQueued) return;
    mountQueued = true;
    requestAnimationFrame(mount);
  }

  var observer = new MutationObserver(queueMount);
  observer.observe(document.getElementById("root") || document.body, {
    childList: true,
    subtree: true
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", queueMount, { once: true });
  } else {
    queueMount();
  }
})();
