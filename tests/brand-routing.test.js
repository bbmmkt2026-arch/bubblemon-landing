const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const middlewarePromise = readFile(path.join(__dirname, '..', 'middleware.js'), 'utf8')
  .then(source => import('data:text/javascript;base64,' + Buffer.from(source).toString('base64')))
  .then(module => module.default);

function request(host, pathname) {
  return new Request(`https://${host}${pathname}`, { headers: { host } });
}

test('홈 주소의 내부 rewrite는 검색 제외 주소로 리다이렉트하지 않는다', async () => {
  const middleware = await middlewarePromise;
  const response = await middleware(request('www.wevapekorea.co.kr', '/'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-middleware-rewrite'), 'https://www.wevapekorea.co.kr/graffiti3');
  assert.equal(response.headers.get('location'), null);
});

test('중복 홈 주소는 캠페인 파라미터를 보존하고 대표 홈으로 영구 이동한다', async () => {
  const middleware = await middlewarePromise;
  for (const pathname of ['/graffiti3', '/graffiti3.html', '/index', '/index.html', '/brand', '/brand.html']) {
    const response = await middleware(request('www.wevapekorea.co.kr', `${pathname}?utm_source=naver`));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), 'https://www.wevapekorea.co.kr/?utm_source=naver');
  }
});

test('새 브랜드 페이지는 위베이프 도메인에서 직접 제공된다', async () => {
  const middleware = await middlewarePromise;
  const response = await middleware(request('www.wevapekorea.co.kr', '/bubblemon'));
  assert.equal(response.headers.get('x-middleware-next'), '1');
});

test('다른 운영 도메인의 브랜드 안내는 대표 도메인으로 모은다', async () => {
  const middleware = await middlewarePromise;
  for (const host of ['www.bbmbrand.store', 'www.bbmkr.store']) {
    const response = await middleware(request(host, '/bubblemon'));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), 'https://www.wevapekorea.co.kr/bubblemon');
  }
});

test('bbmkr 광고 랜딩의 성인인증 게이트가 유지된다', async () => {
  const middleware = await middlewarePromise;
  for (const pathname of ['/', '/graffiti3']) {
    const response = await middleware(request('www.bbmkr.store', pathname));
    assert.equal(response.headers.get('x-middleware-rewrite'), 'https://www.bbmkr.store/adult');
    assert.match(response.headers.get('cache-control'), /private, no-store/);
  }
});

test('각 도메인은 해당 사이트맵을 제공한다', async () => {
  const middleware = await middlewarePromise;
  for (const [host, file] of [['www.wevapekorea.co.kr', 'sitemap-wevapekorea.xml'], ['www.bbmkr.store', 'sitemap-bbmkr.xml']]) {
    const response = await middleware(request(host, '/sitemap.xml'));
    assert.equal(response.headers.get('x-middleware-rewrite'), `https://${host}/${file}`);
  }
});
