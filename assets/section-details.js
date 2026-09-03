(function () {
  "use strict";

  var sections = [
    {
      heading: "#core-title",
      text: "버블몬 Graffiti-III는 출력, 배터리, 충전과 소재의 차이를 실제 사용 편의로 연결했습니다. 눈에 보이는 수치보다 매일 손에 닿는 경험이 더 편안하도록 설계했습니다."
    },
    {
      heading: "#color-title",
      text: "버블몬 Graffiti-III의 네 가지 컬러는 빛과 각도에 따라 서로 다른 표정을 보여줍니다. 오로라 골드, 골드 러쉬, 사파이어 블루, 블랙 중 취향에 맞는 디자인을 선택할 수 있습니다."
    },
    {
      heading: "#control-title",
      text: "버블몬 Graffiti-III는 전원, 출력 조절, 잠금을 버튼 하나로 간편하게 사용할 수 있습니다. 후면 에어플로를 조절해 원하는 흡입감까지 내 방식에 맞출 수 있습니다.",
      variant: "wide"
    },
    {
      heading: "#buy h2",
      text: "버블몬 Graffiti-III의 별빛 그래픽과 메탈 바디가 브랜드만의 시그니처를 완성합니다. 제품 정보와 정품 구매 경로는 버블몬 공식 스토어에서 확인할 수 있습니다.",
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
