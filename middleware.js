// 호스트 기반 라우팅
// - wevapekorea.co.kr / www.wevapekorea.co.kr 로 루트(/) 접속 시 graffiti3.html 을 서빙(URL 유지)
// - 그 외 도메인(bbmbrand.store 등)은 그대로 index.html
// matcher 를 '/' 로 제한해 루트에서만 동작 → 에셋·다른 경로·다른 도메인엔 영향 없음.
// 정적 프로젝트(의존성 없음)라 @vercel/edge 대신 Edge 미들웨어 프로토콜 헤더를 직접 사용.
export const config = { matcher: '/' };

export default function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  if (host === 'wevapekorea.co.kr' || host === 'www.wevapekorea.co.kr') {
    const url = new URL(request.url);
    url.pathname = '/graffiti3'; // cleanUrls:true → .html 대신 clean 경로로 rewrite
    return new Response(null, {
      headers: { 'x-middleware-rewrite': url.toString() },
    });
  }
  // 나머지는 그대로 진행
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}
