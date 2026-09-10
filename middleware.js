// 호스트 기반 라우팅 — 한 번들로 도메인별 루트·robots·sitemap을 가른다.
// - wevapekorea.co.kr : 전용 랜딩(/graffiti3)
// - bbmkr.store       : 네이버 광고 랜딩(/naver)을 루트로 서비스
// - 그 외(bbmbrand.store 등): 기존 index.html 및 검색 설정 유지
// 정적 프로젝트(의존성 없음)라 @vercel/edge 대신 Edge 미들웨어 프로토콜 헤더를 직접 사용.
// cleanUrls:true → rewrite 대상은 .html 대신 clean 경로.
export const config = {
  matcher: [
    '/',
    '/naver',
    '/naver.html',
    '/adult',
    '/adult.html',
    '/graffiti3',
    '/graffiti3.html',
    '/robots.txt',
    '/sitemap.xml',
  ],
};

const AGE_COOKIE = 'bbm_adult';
const BBMKR_PROTECTED_PATHS = new Set(['/', '/naver', '/naver.html', '/graffiti3', '/graffiti3.html']);
const BBMKR_GATE_PATHS = new Set(['/adult', '/adult.html']);

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

function base64UrlBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function readCookie(request, name) {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const item of cookieHeader.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) return item.slice(separator + 1).trim();
  }
  return '';
}

async function hasAdultSession(request) {
  let secret = process.env.AGE_SESSION_SECRET;
  if ((!secret || secret.length < 32) && process.env.PORTONE_API_SECRET) {
    const derived = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`bbmkr-age-session-v1\0${process.env.PORTONE_API_SECRET}`)
    );
    secret = new Uint8Array(derived);
  }
  const token = readCookie(request, AGE_COOKIE);
  if (!secret || !token) return false;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      typeof secret === 'string' ? new TextEncoder().encode(secret) : secret,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const validSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlBytes(signature),
      new TextEncoder().encode(payload)
    );
    if (!validSignature) return false;

    const session = JSON.parse(new TextDecoder().decode(base64UrlBytes(payload)));
    const now = Math.floor(Date.now() / 1000);
    return session.v === 1 && session.adult === true && session.exp > now && session.iat <= now + 300;
  } catch (error) {
    return false;
  }
}

function nextResponse() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

export default async function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase().replace(/^www\./, '');
  const url = new URL(request.url);

  if (host === 'bbmkr.store') {
    const hasAdultAccess = await hasAdultSession(request);

    if (BBMKR_PROTECTED_PATHS.has(url.pathname)) {
      if (!hasAdultAccess) {
        url.pathname = '/adult';
        return new Response(null, {
          headers: {
            'x-middleware-rewrite': url.toString(),
            'Cache-Control': 'private, no-store, max-age=0',
          },
        });
      }

      if (url.pathname === '/') {
        url.pathname = '/naver';
        return new Response(null, {
          headers: {
            'x-middleware-rewrite': url.toString(),
            'Cache-Control': 'private, no-store, max-age=0',
          },
        });
      }

      return nextResponse();
    }

    if (BBMKR_GATE_PATHS.has(url.pathname)) {
      if (hasAdultAccess) return Response.redirect(new URL('/', request.url), 302);
      return nextResponse();
    }
  }

  const target = HOST_ROUTES[host]?.[url.pathname];

  if (!target) return nextResponse();

  url.pathname = target;
  return new Response(null, {
    headers: { 'x-middleware-rewrite': url.toString() },
  });
}
