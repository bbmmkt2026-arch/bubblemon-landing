# 배포 구조 — 도메인별 2트랙

이 저장소는 **하나의 Vercel 번들로 두 개의 랜딩**을 서비스한다.

| 운영 주소 | 파일 | 성격 | 색인 | 성인 게이트 |
|---|---|---|---|---|
| `https://www.bbmbrand.store/` | `index.html` | **기존 메인 랜딩** — 버블몬 브랜드와 공식 스토어 연결 | 허용 | 없음 |
| `https://www.bbmkr.store/` | `naver.html` | **네이버 광고 랜딩** — 브랜드 서사·운영·전국 네트워크·연혁 | 허용 | 없음 |

## 왜 나눴나

네이버 검색광고 [`adguide/262`](https://ads.naver.com/adguide/262)(전자담배 기기장치류 관련 사이트 등록기준)는
이 업종을 **"성인사이트"로 분류**하고, [`adguide/282`](https://ads.naver.com/adguide/282)는
성인콘텐츠를 홍보하는 정보가 **성인인증 이전에 노출되는 것을 금지**한다.

제품 랜딩은 이 조항에 정면으로 걸린다(2026-09 반려 사유). 그래서 광고 연결 URL로 쓸
페이지에서는 청소년유해물건(전자담배 기기장치류) 자체를 **화면에 그리지 않는다.**

262가 요구하는 것 중 브랜드 랜딩이 충족하는 항목:

- **④ 홍보/정보제공 사이트는 메인페이지에 업체명·대표자 성명·사업자등록번호 표시** → 푸터에 있음
- **⑤ 제품 게시 페이지에 "본 제품은 19세 미만 청소년에게 판매할 수 없습니다." 표시** → 구매 CTA 아래, 지정 문구 그대로

> ⚠ **⑦ 링크로 니코틴 액상·카트리지 판매 사이트에 연계하면 광고 불가.**
> 연결되는 스마트스토어에 니코틴 액상이 없어야 한다. 품목이 바뀌면 다시 확인할 것.

## 네이버 광고 랜딩 구성

`naver.html`은 독립된 정적 페이지이며 아래 전용 파일을 사용한다.

```
naver.html
  assets/brand-premium.css
  assets/brand-premium.js
  media/brand-story/
```

`middleware.js`가 요청 호스트를 확인해 `bbmkr.store`의 루트를 내부적으로 `/naver`에
연결한다. `bbmbrand.store/naver`는 새 광고 도메인의 루트로 영구 이동하며, 메인
`index.html`과 구조가 분리되어 있어 광고 랜딩을 수정해도 기존 메인 화면에는 영향을 주지 않는다.

## 도메인별 검색 설정

호스트별 루트·robots·sitemap 연결은 `middleware.js`의 `HOST_ROUTES`에서 관리한다.

```text
bbmbrand.store /       -> index.html
bbmkr.store /          -> naver.html
bbmkr.store robots.txt -> robots-bbmkr.txt
bbmkr.store sitemap.xml -> sitemap-bbmkr.xml
```

광고 랜딩의 대표 주소는 `https://www.bbmkr.store/`다. 다음 항목은 항상 이 주소로 맞춘다.

1. `naver.html`의 canonical·Open Graph·Twitter·구조화 데이터 URL
2. `robots-bbmkr.txt`의 Sitemap 주소
3. `sitemap-bbmkr.xml`의 페이지 주소

## 복원

기존 메인 랜딩의 동일한 사본은 `brand.html`에 남아 있다. 광고 랜딩은 `naver.html`과
전용 CSS·JS·이미지 자산으로 분리되어 있다.
