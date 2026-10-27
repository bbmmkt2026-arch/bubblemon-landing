(() => {
  'use strict';

  const STORE_LINK_SELECTOR =
    'a[href^="https://smartstore.naver.com/bubblemonkorea"]';
  const NAVER_APP_PACKAGE = 'com.nhn.android.search';

  const isIos = () =>
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const isAndroid = () => /Android/i.test(navigator.userAgent);
  const isNaverInApp = () => /NAVER\(inapp/i.test(navigator.userAgent);

  const buildNaverAppUrl = (destination) =>
    'naversearchapp://inappbrowser' +
    `?url=${encodeURIComponent(destination)}&target=new&version=6`;

  const buildAndroidIntentUrl = (destination) => {
    const appQuery =
      `?url=${encodeURIComponent(destination)}&target=new&version=6`;

    return (
      `intent://inappbrowser${appQuery}` +
      '#Intent;' +
      'scheme=naversearchapp;' +
      'action=android.intent.action.VIEW;' +
      'category=android.intent.category.BROWSABLE;' +
      `package=${NAVER_APP_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(destination)};` +
      'end'
    );
  };

  const openNaverAppOnIos = (destination) => {
    let fallbackTimer;

    const cancelFallback = () => {
      if (document.hidden && fallbackTimer) window.clearTimeout(fallbackTimer);
    };

    document.addEventListener('visibilitychange', cancelFallback, { once: true });
    window.addEventListener('pagehide', cancelFallback, { once: true });

    // 네이버 앱이 없거나 호출이 차단되면 스마트스토어 웹으로 계속 진행한다.
    fallbackTimer = window.setTimeout(() => {
      if (!document.hidden) window.location.href = destination;
    }, 1500);

    window.location.href = buildNaverAppUrl(destination);
  };

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const storeLink = event.target.closest?.(STORE_LINK_SELECTOR);
    if (!storeLink || isNaverInApp()) return;

    const destination = storeLink.href;

    if (isAndroid()) {
      event.preventDefault();
      window.location.href = buildAndroidIntentUrl(destination);
      return;
    }

    if (isIos()) {
      event.preventDefault();
      openNaverAppOnIos(destination);
    }
  });
})();
