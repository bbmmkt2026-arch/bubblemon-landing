const test = require('node:test');
const assert = require('node:assert/strict');

const ageVerify = require('../api/age-verify');

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

async function verifyBirthYear(birthYear) {
  const response = createResponse();
  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        status: 'VERIFIED',
        verifiedCustomer: { birthDate: `${birthYear}-12-31` }
      };
    }
  });

  await ageVerify(
    {
      method: 'POST',
      body: { identityVerificationId: 'bbmkr00000000000000000000000000000000' }
    },
    response
  );
  return response;
}

test('청소년보호법의 연도 기준으로 성인 세션을 발급한다', async () => {
  process.env.PORTONE_API_SECRET = 'test-portone-api-secret';
  process.env.AGE_SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';

  const currentYear = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(new Date())
  );

  const adultResponse = await verifyBirthYear(currentYear - 19);
  assert.equal(adultResponse.statusCode, 200);
  assert.equal(adultResponse.body.verified, true);
  assert.match(adultResponse.headers['set-cookie'], /^bbm_adult=/);
  assert.match(adultResponse.headers['set-cookie'], /HttpOnly/);
  assert.match(adultResponse.headers['set-cookie'], /Secure/);

  const underageResponse = await verifyBirthYear(currentYear - 18);
  assert.equal(underageResponse.statusCode, 403);
  assert.equal(underageResponse.body.code, 'UNDERAGE');
  assert.equal(underageResponse.headers['set-cookie'], undefined);
});
