(() => {
  const TECH_ID = "dual-injection";
  const CARD_TITLE = "DUAL-INJECTION";
  const CARD_BODY =
    "열 전달을 낮춘 이중사출 드립팁으로 입술에 닿는 부담을 줄이고, 분리해 더욱 위생적으로 관리할 수 있습니다. 롤리팟-J와도 호환됩니다.";
  const CARD_IMAGE = "./products/graffiti3-spec-pod-detach-v3.webp";
  const SECTION_TITLE = "기술이 만든, 더 편한 경험.";
  const EXPERIENCE_COPY = {
    "OUTPUT 5–25W":
      "5–25W 범위에서 취향에 맞는 흡입감과 무화량을 세밀하게 조절할 수 있습니다.",
    "BATTERY 1500mAh":
      "1500mAh 대용량 배터리로 충전 부담을 줄이고, 더 오래 여유롭게 사용할 수 있습니다.",
    "C-TYPE":
      "사용하던 C타입 케이블로 간편하게 충전할 수 있어 준비가 한결 가벼워집니다.",
    "METAL BODY":
      "견고한 메탈 바디가 손에 안정적으로 잡히며, 차분한 무광 질감으로 일상에서 부담 없이 사용할 수 있습니다.",
    "KC CERTIFIED":
      "KC 인증을 완료한 제품으로, 기본 안전 기준을 확인하고 한결 안심하며 사용할 수 있습니다.",
    [CARD_TITLE]: CARD_BODY,
  };

  let mountQueued = false;

  const updateExperienceCopy = (section) => {
    const heading = section.querySelector("#core-title");
    if (heading && heading.textContent !== SECTION_TITLE) {
      heading.textContent = SECTION_TITLE;
    }

    section.querySelectorAll("article").forEach((card) => {
      const title = card.querySelector("h3");
      const body = card.querySelector("p");
      const nextCopy = EXPERIENCE_COPY[title?.textContent.trim()];
      if (body && nextCopy && body.textContent !== nextCopy) {
        body.textContent = nextCopy;
      }
    });
  };

  const setCurrentDot = (section, rail, dots) => {
    const cards = [...rail.querySelectorAll(":scope > article")];
    const buttons = [...dots.querySelectorAll(":scope > button")];
    if (!cards.length || !buttons.length) return;

    const railCenter = rail.getBoundingClientRect().left + rail.clientWidth / 2;
    let activeIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - railCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        activeIndex = index;
      }
    });

    const activeClass = section.dataset.bbmCoreActiveClass || "";
    buttons.forEach((button, index) => {
      const isActive = index === activeIndex;
      button.className = isActive ? activeClass : "";
      if (isActive) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  };

  const mountTechCard = () => {
    mountQueued = false;

    const section = document.querySelector('section[aria-labelledby="core-title"]');
    const firstCard = section?.querySelector("article");
    const rail = firstCard?.parentElement;
    const dots = section?.querySelector('[aria-label="핵심 기술 슬라이드 선택"]');
    if (!section || !firstCard || !rail || !dots) return;

    if (!section.dataset.bbmCoreActiveClass) {
      section.dataset.bbmCoreActiveClass =
        dots.querySelector('[aria-current="true"]')?.className || "";
    }

    let card = rail.querySelector(`[data-bbm-tech="${TECH_ID}"]`);
    if (!card) {
      const copyTemplate = firstCard.children[0];
      const mediaTemplate = firstCard.children[1];

      card = document.createElement("article");
      card.className = `${firstCard.className} bbm-dual-injection-card`;
      card.dataset.bbmTech = TECH_ID;

      const copy = document.createElement("div");
      copy.className = copyTemplate?.className || "";

      const title = document.createElement("h3");
      title.textContent = CARD_TITLE;

      const body = document.createElement("p");
      body.textContent = CARD_BODY;

      const media = document.createElement("div");
      media.className = mediaTemplate?.className || "";

      const image = document.createElement("img");
      image.loading = "lazy";
      image.src = CARD_IMAGE;
      image.alt = "본체에서 분리된 그래피티-Ⅲ 롤리팟-J 파드와 이중사출 드립팁";

      copy.append(title, body);
      media.append(image);
      card.append(copy, media);
      rail.append(card);
    }

    let dot = dots.querySelector(`[data-bbm-tech-dot="${TECH_ID}"]`);
    if (!dot) {
      dot = document.createElement("button");
      dot.type = "button";
      dot.dataset.bbmTechDot = TECH_ID;
      dot.setAttribute("aria-label", "6번 슬라이드 이중사출 드립팁");
      dots.append(dot);
    }

    if (!dot.dataset.bbmClickReady) {
      dot.dataset.bbmClickReady = "true";
      dot.addEventListener("click", () => {
        const left =
          rail.scrollLeft +
          card.getBoundingClientRect().left -
          rail.getBoundingClientRect().left -
          (rail.clientWidth - card.clientWidth) / 2;
        rail.scrollTo({ left, behavior: "smooth" });
      });
    }

    if (!rail.dataset.bbmTechScrollReady) {
      rail.dataset.bbmTechScrollReady = "true";
      let frame = 0;
      rail.addEventListener(
        "scroll",
        () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() =>
            requestAnimationFrame(() => setCurrentDot(section, rail, dots)),
          );
        },
        { passive: true },
      );
    }

    updateExperienceCopy(section);
  };

  const queueMount = () => {
    if (mountQueued) return;
    mountQueued = true;
    requestAnimationFrame(mountTechCard);
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
