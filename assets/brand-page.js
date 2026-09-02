(() => {
  "use strict";

  /* ==========================================================================
     브랜드 랜딩 오버레이  (/brand)
     --------------------------------------------------------------------------
     brand-page.css 가 제품 구간을 숨기는 동안, 이 스크립트는 남은 뼈대에
     브랜드 카피를 다시 입힌다. app.js 는 빌드 산출물이라 손대지 않고
     기존 방식(brand-section.js / store-selection.js)과 동일하게 DOM 위에 얹는다.

     제품 모델명(그래피티-Ⅲ)과 스펙 표현은 이 페이지 어디에도 남기지 않는다 —
     adguide/282 ③ "성인콘텐츠를 홍보하는 내용의 정보가 성인인증 이전에
     노출되어서는 안됨" 이 걸리는 지점이 정확히 거기다.
     ========================================================================== */

  /* 사업장 소재지. 전자상거래법 제10조(사이버몰 운영자의 표시의무)가 상호·대표자·
     영업소 주소·전화번호·이메일·사업자등록번호·통신판매업 신고번호를 요구하는데
     번들 푸터에 주소만 빠져 있다. 값을 채우면 푸터 사업자정보 줄에 자동으로 붙는다.
     출처: 「통합 마케팅 운영 및 랜딩페이지 구축 용역계약서」(2026-08-18 체결) 갑 당사자 주소.
     송장 발송인 주소 "(22769) 인천광역시 서구 원석로 54 (시그마종합개발) 1층" 및
     견적서 기재값과도 일치한다.
     ⚠ 비워두면 아무것도 넣지 않는다 — 실제 주소가 아닌 값을 표시하면 안 된다. */
  const BIZ_ADDRESS = "인천광역시 서구 원석로 54 (석남동)";
  const STORE_COUNT = 484;
  const OFFICIAL_PRODUCT_URL =
    "https://smartstore.naver.com/bubblemonkorea/products/13658197568";

  let queued = false;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  /* --- 브랜드 히어로: WEVAPE 서브 / BUBBLEMON 메인 ------------------------
     최상단 제품 페이지 헤더는 CSS에서 제거한다. 중간 브랜드 히어로는 살리고,
     모든 영문 워드마크를 텍스트가 아닌 실제 로고 이미지로 구성한다. */
  const mountHero = () => {
    const hero = document.getElementById("top");
    if (!hero || hero.dataset.bbmBrandHero === "true") return Boolean(hero);

    const heroText = hero.querySelector('[class*="heroText"]');
    if (!heroText) return false;

    const wevapeLogo = document.createElement("img");
    wevapeLogo.className = "bbm-hero-wevape-logo";
    wevapeLogo.src = "./products/wevape-logo.webp";
    wevapeLogo.alt = "WEVAPE";

    const bubblemonLogo = document.createElement("img");
    bubblemonLogo.className = "bbm-hero-bubblemon-logo";
    bubblemonLogo.src = "./products/bubblemon-logo.webp";
    bubblemonLogo.alt = "BUBBLEMON";

    const lead = el(
      "p",
      "bbm-hero-lead",
      "편의점에서 익숙했던 이름, 버블몬."
    );

    heroText.replaceChildren(wevapeLogo, bubblemonLogo, lead);
    hero.dataset.bbmBrandHero = "true";

    return true;
  };

  /* --- 브랜드 섹션: 제품 언급 제거 ------------------------------------------
     brand-section.js 가 #stores 앞에 섹션을 꽂은 뒤에 실행되어야 한다.
     문구만 갈아끼우고 바로 아래 #stores(지도)로 흐르게 둔다. */
  const mountBrand = () => {
    const section = document.querySelector(".bbm-brand-section");
    if (!section || section.dataset.bbmBrandCopy === "true") return Boolean(section);

    const title = section.querySelector("#bbm-brand-title");
    const lead = section.querySelector(".bbm-brand-lead");
    if (!title || !lead) return false;

    // 원본 카피는 "디바이스의 기준" / "그래피티-Ⅲ" 로 끝난다 → 제품 언급을 걷어낸다
    title.textContent = "매장을 만든 경험으로,\n브랜드의 기준을 만듭니다.";
    lead.textContent =
      `편의점에서 익숙했던 버블몬. 위베이프라는 간판을 걸고, 지금은 전국 ${STORE_COUNT}개 매장에서 고객을 맞습니다.`;

    section.dataset.bbmBrandCopy = "true";
    return true;
  };

  /* 카카오 지도는 매장 구간이 열릴 때만 필요하다. 초기 로드에서 빼면
     kakao-map.js(12.5KB) + 매장 JSON(149KB) + 카카오 SDK 를 아끼고,
     기본 화면(히어로만)의 요청 수가 절반으로 준다.
     kakao-map.js 는 컨테이너를 폴링해서 붙으므로 늦게 주입해도 그대로 동작한다. */
  const loadMapScript = () => {
    if (document.querySelector("script[data-bbm-map]")) return;
    const script = document.createElement("script");
    script.src = "./assets/kakao-map.js?v=3";
    script.dataset.bbmMap = "true";
    document.head.appendChild(script);
  };

  /* --- 브랜드 서사 + 지도/매장 구간 토글 --------------------------------------
     기본은 히어로만 보이고, 이 버튼을 눌러야 아래가 펼쳐진다.
     실제 숨김은 brand-page.css 가 <html data-bbm-stores> 로 처리한다.

     ⚠ 접힌 동안 지도 컨테이너는 크기가 0이라, 펼친 뒤 반드시 resize 를 쏴야 한다.
       kakao-map.js 가 window resize 에서 map.relayout() 을 부른다. */
  const mountStoresToggle = () => {
    const brand = document.querySelector(".bbm-brand-section");
    const stores = document.getElementById("stores");
    if (!brand || !stores) return false;
    if (document.querySelector(".bbm-stores-toggle")) return true;

    const wrap = el("div", "bbm-stores-toggle-wrap");
    const button = el("button", "bbm-stores-toggle");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "stores");

    const label = document.createElement("span");
    const caret = el("b", "", "⌄");
    const storeCount = el(
      "p",
      "bbm-stores-count",
      `${STORE_COUNT}개 매장에서 만날 수 있습니다.`
    );
    caret.setAttribute("aria-hidden", "true");
    label.textContent = "전국 매장 찾기";
    button.append(label, caret);

    const setOpen = (open, shouldScroll = true) => {
      if (!open) {
        delete document.documentElement.dataset.bbmStores;
        button.setAttribute("aria-expanded", "false");
        label.textContent = "전국 매장 찾기";
        if (location.hash === "#stores") {
          history.replaceState(null, "", location.pathname + location.search);
        }
        return;
      }

      document.documentElement.dataset.bbmStores = "open";
      button.setAttribute("aria-expanded", "true");
      label.textContent = "매장 정보 접기";
      if (location.hash !== "#stores") {
        history.replaceState(null, "", location.pathname + location.search + "#stores");
      }

      loadMapScript();

      // 0 크기로 초기화된 지도를 다시 잡아준다
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
      window.setTimeout(() => {
        brand.classList.add("is-visible");
        if (shouldScroll) stores.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    };

    button.addEventListener("click", () => {
      const open = document.documentElement.dataset.bbmStores === "open";
      setOpen(!open, true);
    });

    wrap.append(button, storeCount);
    brand.parentNode.insertBefore(wrap, stores);

    if (location.hash === "#stores") {
      setOpen(true, true);
    }

    window.addEventListener("hashchange", () => {
      if (location.hash === "#stores") setOpen(true, true);
    });
    return true;
  };

  /* --- 브랜드 랜딩 푸터: 제품 페이지용 청소년 문구 제거 ---------------------
     이 페이지는 제품 이미지·모델명·스펙을 게시하지 않는 브랜드/매장 안내다.
     제품 랜딩에서 상속된 고지는 브랜드 페이지에서만 숨기고,
     실제 제품 페이지와 외부 상품 상세의 고지·성인확인은 그대로 둔다. */
  const mountYouthNotice = () => {
    const info = document.querySelector("#buy footer [class*='footerInfo']");
    if (!info || info.dataset.bbmYouthNotice === "true") return Boolean(info);

    [...info.querySelectorAll("p")]
      .filter((paragraph) =>
        paragraph.textContent.includes("19세 미만") ||
        paragraph.textContent.includes("청소년 보호법에 따라")
      )
      .forEach((paragraph) => {
        paragraph.hidden = true;
        paragraph.setAttribute("aria-hidden", "true");
      });

    info.dataset.bbmYouthNotice = "true";
    return true;
  };

  /* --- 푸터 브랜드: BUBBLEMON 메인 ----------------------------------------
     제품 페이지에서 물려받은 WEVAPE 로고와 공식사이트 표기를
     브랜드 랜딩에서만 버블몬 기준으로 교체한다. */
  const mountFooterBrand = () => {
    const footer = document.querySelector("#buy footer");
    if (!footer || footer.dataset.bbmFooterBrand === "true") return Boolean(footer);

    const logo = footer.querySelector("img");
    const siteLabel = [...footer.querySelectorAll("p")].find((paragraph) =>
      paragraph.textContent.includes("공식사이트")
    );
    if (!logo || !siteLabel) return false;

    logo.src = "./products/bubblemon-logo.webp";
    logo.alt = "BUBBLEMON";
    logo.classList.add("bbm-footer-bubblemon-logo");
    siteLabel.textContent = "공식사이트";
    siteLabel.classList.add("bbm-footer-site-label");

    footer.dataset.bbmFooterBrand = "true";
    return true;
  };

  /* --- 하단 고정바 ------------------------------------------------------------
     시계는 brand-page.css 가 숨긴다. 여기서는 문구 두 개를 갈아끼운다.
       왼쪽 : "당일 배송 주문 마감"  →  "정품은 버블몬 공식 스토어에서"
       버튼 : "지금 구매하기"        →  "정품 구매하기" (하단 섹션과 통일)
     링크(스마트스토어)와 dataLayer 이벤트는 원본 그대로 둔다. */
  const mountSticky = () => {
    const sticky = document.querySelector(
      'aside[data-bbm-brand-sticky="true"], aside[aria-label="스마트스토어 구매"]'
    );
    if (!sticky || sticky.dataset.bbmBrandSticky === "true") return Boolean(sticky);

    const copy = sticky.querySelector(":scope > div:first-child");
    const label = copy && copy.querySelector(":scope > span:first-child");
    const button = sticky.querySelector("a");
    if (!copy || !label || !button) return false;

    label.textContent = "버블몬코리아 공식 스토어";
    label.classList.add("bbm-store-dock-copy-text");
    copy.setAttribute(
      "aria-label",
      "버블몬코리아 공식 스토어. 정품은 공식 판매처에서 확인하세요."
    );

    [...button.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        node.textContent = "스토어 보기 ";
      }
    });
    button.querySelector("b")?.remove();
    button.href = OFFICIAL_PRODUCT_URL;
    button.setAttribute("aria-label", "버블몬코리아 공식 스토어 보기 (새 창)");

    sticky.classList.add("bbm-store-dock");
    delete document.documentElement.dataset.bbmDockAtEnd;

    const stores = document.getElementById("stores");
    if (stores && stores.dataset.bbmDockFocus !== "true") {
      stores.dataset.bbmDockFocus = "true";
      stores.addEventListener("focusin", (event) => {
        if (event.target.matches("input, textarea, [contenteditable='true']")) {
          document.documentElement.dataset.bbmStoreInputFocus = "true";
        }
      });
      stores.addEventListener("focusout", () => {
        window.setTimeout(() => {
          const active = document.activeElement;
          if (!active || !active.matches("input, textarea, [contenteditable='true']")) {
            delete document.documentElement.dataset.bbmStoreInputFocus;
          }
        }, 0);
      });
    }

    sticky.dataset.bbmBrandSticky = "true";
    return true;
  };

  /* --- 푸터: 사업장 주소 보강 (전자상거래법 §10) -----------------------------
     번들의 두 번째 사업자정보 줄은 [사업자등록번호 | 통신판매업 | e-mail | 전화]
     구성이다. 통신판매업 신고번호 뒤에 주소를 끼워 넣는다. */
  const mountFooterAddress = () => {
    if (!BIZ_ADDRESS) return true; // 주소 미확정 — 아무것도 표시하지 않는다

    const footer = document.querySelector("#buy footer");
    if (!footer || footer.dataset.bbmBizAddress === "true") return Boolean(footer);

    const anchor = [...footer.querySelectorAll("p > span")].find((span) =>
      span.textContent.startsWith("통신판매업")
    );
    if (!anchor) return false;

    const divider = el("i", "", "|");
    divider.setAttribute("aria-hidden", "true");
    anchor.after(divider, el("span", "", "주소 : " + BIZ_ADDRESS));

    footer.dataset.bbmBizAddress = "true";
    return true;
  };

  /* 문구 교체가 끝났음을 <html> 에 표시한다. brand-page.css 는 이 플래그가
     붙기 전까지 원본 제품 문구(GRAFFITI-Ⅲ / 당일 배송 주문 마감)를 가려둔다 —
     교체 전 상태가 한 프레임이라도 페인트되면 안 되기 때문이다. */
  const markReady = () => {
    const hero = document.getElementById("top");
    const brand = document.querySelector(".bbm-brand-section");
    const sticky = document.querySelector('aside[data-bbm-brand-sticky="true"]');
    if (
      hero?.dataset.bbmBrandHero === "true" &&
      brand?.dataset.bbmBrandCopy === "true" &&
      sticky?.dataset.bbmBrandSticky === "true"
    ) {
      document.documentElement.dataset.bbmReady = "true";
    }
  };

  const mountAll = () => {
    queued = false;
    const done = [
      mountHero(),
      mountBrand(),
      mountStoresToggle(),
      mountYouthNotice(),
      mountFooterBrand(),
      mountSticky(),
      mountFooterAddress(),
    ].every(Boolean);
    markReady();
    return done;
  };

  /* ⚠ requestAnimationFrame 을 쓰면 안 된다 — 백그라운드 탭(새 탭으로 열기,
     cmd+click)에서는 rAF 가 멈춰서 스크립트가 통째로 실행되지 않는다.
     그러면 제품 모델명이 그대로 노출된다. setTimeout 은 배경 탭에서도 돈다. */
  const queue = () => {
    if (queued) return;
    queued = true;
    window.setTimeout(() => {
      if (mountAll()) observer.disconnect();
    }, 0);
  };

  const observer = new MutationObserver(queue);
  observer.observe(document.getElementById("root") || document.documentElement, {
    childList: true,
    subtree: true,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", queue, { once: true });
  } else {
    queue();
  }
  window.addEventListener("load", queue);
  document.addEventListener("visibilitychange", queue);

  // 뮤테이션이 더 이상 오지 않는 경우를 대비한 보강 재시도
  [200, 600, 1500, 3000, 6000].forEach((ms) => window.setTimeout(queue, ms));

  window.setTimeout(() => observer.disconnect(), 20000);
})();
