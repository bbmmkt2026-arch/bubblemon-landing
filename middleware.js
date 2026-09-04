// 호스트 기반 라우팅 — 한 번들로 도메인별 루트·robots·sitemap을 가른다.
// - wevapekorea.co.kr : 전용 랜딩(/graffiti3)
// - bbmkr.store       : 네이버 광고 랜딩(/naver)을 루트로 서비스
// - 그 외(bbmbrand.store 등): 기존 index.html 및 검색 설정 유지
// 정적 프로젝트(의존성 없음)라 @vercel/edge 대신 Edge 미들웨어 프로토콜 헤더를 직접 사용.
// cleanUrls:true → rewrite 대상은 .html 대신 clean 경로.
export const config = { matcher: ['/', '/robots.txt', '/sitemap.xml'] };

const HOST_ROUTES = {
  'wevapekorea.co.kr': {
    '/': '/graffiti3',
    '/robots.txt': '/robots-wevapekorea.txt',
    '/sitemap.xml': '/sitemap-wevapekorea.xml',
  },
  'bbmkr.store': {
    '/': '/naver',
    '/robots.txt': '/robots-bbmkr.txt',
    '/sitemap.xml': '/sitemap-bbmkr.xml',
  },
};

export default function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase().replace(/^www\./, '');
  const url = new URL(request.url);
  const target = HOST_ROUTES[host]?.[url.pathname];

  if (!target) {
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  url.pathname = target;
  return new Response(null, {
    headers: { 'x-middleware-rewrite': url.toString() },
  });
}
