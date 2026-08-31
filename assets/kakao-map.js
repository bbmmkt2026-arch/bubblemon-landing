/* ------------------------------------------------------------------
 *  카카오맵 주입 스크립트 (고도화 버전)
 *  - 기존 빌드(app.js)는 구글맵스용이라 지도가 안 뜸.
 *  - 이 스크립트가 지도 컨테이너(.googleMap)에 카카오 지도를 그려넣음.
 *  기능: 초기화면=명동역 / 마커 클러스터링 / 커스텀 골드 마커 /
 *        말풍선+카카오맵 길찾기 / 목록↔지도 연동 / 현재위치 / 줌·지도타입 컨트롤
 * ------------------------------------------------------------------ */
(function () {
  "use strict";

  var KAKAO_KEY = "3f0739842d7e1afad15ecaa69a01bbb6";
  var DATA_URL = "./data/wevape-stores-260826-geo.json";
  var INIT_CENTER = { lat: 37.5610, lng: 126.9862 }; // 명동역
  var INIT_LEVEL = 5;

  var initialized = false;
  var storesPromise = null;

  // ---------- 마커 이미지 (SVG data URI) ----------
  function dataUri(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  var STORE_PIN = dataUri(
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">' +
      '<path d="M14 0C6.3 0 0 6.3 0 14c0 9.6 14 24 14 24s14-14.4 14-24C28 6.3 21.7 0 14 0z" fill="#caa263" stroke="#fff" stroke-width="1.5"/>' +
      '<circle cx="14" cy="14" r="5" fill="#0b0b0c"/></svg>'
  );
  var ME_PIN = dataUri(
    '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">' +
      '<circle cx="11" cy="11" r="7" fill="#0a84ff" stroke="#fff" stroke-width="3"/></svg>'
  );

  // ---------- 스타일 주입 ----------
  function injectCss() {
    if (document.getElementById("wvmap-css")) return;
    var css =
      ".wvmap-ov{background:#0b0b0c;color:#f5f5f7;border:1px solid rgba(202,162,99,.5);border-radius:12px;padding:12px 30px 12px 14px;min-width:190px;max-width:250px;box-shadow:0 8px 24px rgba(0,0,0,.55);font-family:system-ui,'Apple SD Gothic Neo',sans-serif;position:relative}" +
      ".wvmap-ov h4{margin:0 0 4px;font-size:14px;line-height:1.3}" +
      ".wvmap-ov p{margin:0 0 10px;font-size:12px;color:#aaa;line-height:1.5}" +
      ".wvmap-ov .wvmap-btns{display:flex;gap:6px}" +
      ".wvmap-ov a{display:inline-block;padding:6px 10px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700}" +
      ".wvmap-ov a.go{background:#caa263;color:#111}" +
      ".wvmap-ov a.view{background:#1f1f22;color:#e5e5e7;border:1px solid #3a3a3d}" +
      ".wvmap-ov .wvmap-close{position:absolute;top:6px;right:9px;cursor:pointer;color:#888;font-size:15px;background:none;border:none;line-height:1}" +
      ".wvmap-ov:after{content:'';position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);border:8px solid transparent;border-top-color:#0b0b0c}" +
      ".wvmap-hl{outline:2px solid #caa263 !important;outline-offset:-2px;border-radius:12px}" +
      ".wvmap-locate{position:absolute;right:10px;bottom:28px;z-index:5;width:40px;height:40px;border-radius:8px;background:#fff;border:1px solid #bbb;cursor:pointer;font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center}" +
      ".wvmap-locate:hover{background:#f2f2f2}" +
      "@media(max-width:900px){.wvmap-locate{display:none}}";
    var st = document.createElement("style");
    st.id = "wvmap-css";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function loadStores() {
    if (!storesPromise) {
      storesPromise = fetch(DATA_URL)
        .then(function (r) { return r.json(); })
        .then(function (j) {
          return ((j && j.stores) || []).filter(function (s) {
            return typeof s.lat === "number" && typeof s.lng === "number";
          });
        })
        .catch(function (e) { console.error("[kakao-map] 데이터 로드 실패", e); return []; });
    }
    return storesPromise;
  }

  function loadSdk() {
    return new Promise(function (resolve, reject) {
      if (window.kakao && window.kakao.maps && window.kakao.maps.MarkerClusterer) { resolve(); return; }
      var s = document.createElement("script");
      s.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=" + KAKAO_KEY + "&autoload=false&libraries=clusterer";
      s.onload = function () { window.kakao.maps.load(resolve); };
      s.onerror = function () { reject(new Error("카카오 SDK 로드 실패")); };
      document.head.appendChild(s);
    });
  }

  function findContainer() { return document.querySelector('[class*="googleMap"]'); }

  function haversine(a, b) {
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2);
    var t = s1 * s1 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
    return 2 * R * Math.asin(Math.sqrt(t));
  }

  function render(container, stores) {
    var kakao = window.kakao;
    injectCss();

    container.setAttribute("data-visible", "true");
    container.style.opacity = "1";
    document.querySelectorAll('[class*="mapFallback"]').forEach(function (f) { f.style.display = "none"; });

    var mapEl = document.createElement("div");
    mapEl.id = "kakao-map-injected";
    mapEl.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    container.appendChild(mapEl);

    // (초기화면) 명동역 중심
    // 모바일 지도는 읽기 전용이다. 목록에서 매장을 선택할 때만
    // 스크립트가 중심과 오버레이를 갱신하고, 직접 드래그/줌은 받지 않는다.
    var isMobile = window.matchMedia("(max-width: 900px)").matches;
    var map = new kakao.maps.Map(mapEl, {
      center: new kakao.maps.LatLng(INIT_CENTER.lat, INIT_CENTER.lng),
      level: INIT_LEVEL,
      draggable: !isMobile,
    });

    if (isMobile) {
      map.setZoomable(false);
      mapEl.style.pointerEvents = "none";
      mapEl.style.touchAction = "pan-y";
    }

    // (6) 줌 / 지도타입 컨트롤
    if (!isMobile) {
      map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
      map.addControl(new kakao.maps.MapTypeControl(), kakao.maps.ControlPosition.TOPRIGHT);
    }

    // (2) 커스텀 골드 마커
    var pinImg = new kakao.maps.MarkerImage(STORE_PIN, new kakao.maps.Size(28, 38), {
      offset: new kakao.maps.Point(14, 38),
    });

    var markers = [], byName = {}, openOverlay = null;

    function openStore(s, marker) {
      if (openOverlay) openOverlay.setMap(null);
      var name = esc(s.name), addr = esc(s.address || "");
      var q = encodeURIComponent(s.name) + "," + s.lat + "," + s.lng;
      var el = document.createElement("div");
      el.className = "wvmap-ov";
      el.innerHTML =
        '<button class="wvmap-close" aria-label="닫기">×</button>' +
        "<h4>" + name + "</h4>" +
        (addr ? "<p>" + addr + "</p>" : "") +
        '<div class="wvmap-btns">' +
        '<a class="go" target="_blank" rel="noopener" href="https://map.kakao.com/link/to/' + q + '">길찾기</a>' +
        '<a class="view" target="_blank" rel="noopener" href="https://map.kakao.com/link/map/' + q + '">지도보기</a>' +
        "</div>";
      var ov = new kakao.maps.CustomOverlay({
        content: el, position: marker.getPosition(), yAnchor: 1.32, xAnchor: 0.5, zIndex: 100,
      });
      ov.setMap(map);
      openOverlay = ov;
      el.querySelector(".wvmap-close").onclick = function () { ov.setMap(null); openOverlay = null; };
      map.panTo(marker.getPosition());
      highlightCard(s.name);
    }

    stores.forEach(function (s) {
      var marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(s.lat, s.lng), title: s.name, image: pinImg,
      });
      markers.push(marker);
      if (!byName[s.name]) byName[s.name] = marker;
      kakao.maps.event.addListener(marker, "click", function () { openStore(s, marker); });
    });

    // (1) 클러스터링
    if (kakao.maps.MarkerClusterer) {
      var clusterer = new kakao.maps.MarkerClusterer({
        map: map, averageCenter: true, minLevel: 6, gridSize: 70, disableClickZoom: false,
        styles: [
          { width: "40px", height: "40px", background: "rgba(202,162,99,.85)", borderRadius: "20px", color: "#111", textAlign: "center", lineHeight: "40px", fontWeight: "700", fontSize: "13px", border: "2px solid #fff" },
          { width: "52px", height: "52px", background: "rgba(202,162,99,.92)", borderRadius: "26px", color: "#111", textAlign: "center", lineHeight: "52px", fontWeight: "700", fontSize: "15px", border: "2px solid #fff" },
        ],
      });
      clusterer.addMarkers(markers);
    } else {
      markers.forEach(function (m) { m.setMap(map); });
    }

    // (4) 목록 → 지도
    function findStoreByText(text) {
      var best = null;
      stores.forEach(function (s) {
        if (text.indexOf(s.name) >= 0 && (!best || s.name.length > best.name.length)) best = s;
      });
      return best;
    }
    var listEl = document.querySelector('[class*="storeList"]');
    if (listEl) {
      listEl.addEventListener("click", function (e) {
        var card = e.target.closest("article");
        if (!card) return;
        var s = findStoreByText(card.textContent || "");
        if (s) {
          if (map.getLevel() > 5) map.setLevel(5);
          openStore(s, byName[s.name]);
        }
      });
    }

    // (4) 지도 → 목록 (하이라이트 + 스크롤)
    function highlightCard(name) {
      var list = document.querySelector('[class*="storeList"]');
      if (!list) return;
      var cards = list.querySelectorAll("article");
      for (var i = 0; i < cards.length; i++) {
        if ((cards[i].textContent || "").indexOf(name) >= 0) {
          try { cards[i].scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
          cards[i].classList.add("wvmap-hl");
          (function (c) { setTimeout(function () { c.classList.remove("wvmap-hl"); }, 2500); })(cards[i]);
          break;
        }
      }
    }

    // (5) 현재 위치
    var meMarker = null;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wvmap-locate";
    btn.title = "내 주변 매장";
    btn.textContent = "📍";
    mapEl.appendChild(btn);
    btn.onclick = function () {
      if (!navigator.geolocation) { alert("이 브라우저에서는 현재 위치를 사용할 수 없습니다."); return; }
      btn.textContent = "…";
      navigator.geolocation.getCurrentPosition(
        function (p) {
          btn.textContent = "📍";
          var me = { lat: p.coords.latitude, lng: p.coords.longitude };
          var mePos = new kakao.maps.LatLng(me.lat, me.lng);
          if (meMarker) meMarker.setMap(null);
          meMarker = new kakao.maps.Marker({
            position: mePos, image: new kakao.maps.MarkerImage(ME_PIN, new kakao.maps.Size(22, 22), { offset: new kakao.maps.Point(11, 11) }), zIndex: 200,
          });
          meMarker.setMap(map);
          // 가장 가까운 매장
          var nearest = null, best = Infinity;
          stores.forEach(function (s) { var d = haversine(me, s); if (d < best) { best = d; nearest = s; } });
          map.setLevel(6);
          map.panTo(mePos);
          if (nearest) setTimeout(function () { openStore(nearest, byName[nearest.name]); }, 400);
        },
        function () { btn.textContent = "📍"; alert("위치 권한을 허용하면 가까운 매장을 찾을 수 있습니다."); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    // 레이아웃 보정 (컨테이너 크기 늦게 잡히는 경우) — 명동역 유지
    setTimeout(function () {
      map.relayout();
      map.setCenter(new kakao.maps.LatLng(INIT_CENTER.lat, INIT_CENTER.lng));
      map.setLevel(INIT_LEVEL);
    }, 300);
    window.addEventListener("resize", function () { map.relayout(); });

    console.log("[kakao-map] 고도화 지도 렌더 완료, 매장 " + stores.length + "개");
  }

  function tryInit() {
    if (initialized) return;
    var container = findContainer();
    if (!container) return;
    initialized = true;
    Promise.all([loadSdk(), loadStores()])
      .then(function (res) { render(container, res[1]); })
      .catch(function (e) { console.error("[kakao-map] 초기화 실패", e); initialized = false; });
  }

  var poll = setInterval(function () { tryInit(); if (initialized) clearInterval(poll); }, 400);
  setTimeout(function () { clearInterval(poll); }, 20000);
  if (document.readyState !== "loading") tryInit();
  else document.addEventListener("DOMContentLoaded", tryInit);
})();
