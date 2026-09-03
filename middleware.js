// 호스트 기반 라우팅
// - wevapekorea.co.kr: 전용 랜딩, robots.txt, sitemap.xml 제공
// - 그 외 도메인(bbmbrand.store 등): 기존 index.html 및 검색 설정 유지
// 정적 프로젝트(의존성 없음)라 @vercel/edge 대신 Edge 미들웨어 프로토콜 헤더를 직접 사용.
export const config = { matcher: ['/', '/robots.txt', '/sitemap.xml'] };

export default function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const url = new URL(request.url);

  if (host === 'wevapekorea.co.kr' || host === 'www.wevapekorea.co.kr') {
    if (url.pathname === '/') {
      url.pathname = '/graffiti3'; // cleanUrls:true → .html 대신 clean 경로로 rewrite
    } else if (url.pathname === '/robots.txt') {
      url.pathname = '/robots-wevapekorea.txt';
    } else if (url.pathname === '/sitemap.xml') {
      url.pathname = '/sitemap-wevapekorea.xml';
    } else {
      return new Response(null, { headers: { 'x-middleware-next': '1' } });
    }

    return new Response(null, {
      headers: { 'x-middleware-rewrite': url.toString() },
    });
  }
  // 나머지는 그대로 진행
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}
