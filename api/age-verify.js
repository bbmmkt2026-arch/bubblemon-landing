const { createAdultToken, serializeAdultCookie } = require('./_age-token');

function getSeoulYear() {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric'
    }).format(new Date())
  );
}

function qualifiesAsAdult(birthDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birthDate || ''));
  if (!match) return false;
  return getSeoulYear() - Number(match[1]) >= 19;
}

module.exports = async function ageVerify(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ message: 'Method not allowed.' });
  }

  const identityVerificationId = request.body?.identityVerificationId;
  if (!/^bbmkr[A-Za-z0-9]{32}$/.test(String(identityVerificationId || ''))) {
    return response.status(400).json({ message: 'Invalid identity verification ID.' });
  }

  const apiSecret = process.env.PORTONE_API_SECRET;
  if (!apiSecret || !process.env.AGE_SESSION_SECRET) {
    return response.status(503).json({ message: 'Adult verification is not configured.' });
  }

  try {
    const verificationResponse = await fetch(
      `https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`,
      {
        headers: {
          Authorization: `PortOne ${apiSecret}`,
          Accept: 'application/json'
        }
      }
    );

    if (!verificationResponse.ok) {
      return response.status(502).json({ message: '성인인증 결과를 확인하지 못했습니다.' });
    }

    const verification = await verificationResponse.json();
    if (verification.status !== 'VERIFIED' || !verification.verifiedCustomer?.birthDate) {
      return response.status(401).json({ message: '완료된 본인인증 내역이 아닙니다.' });
    }

    if (!qualifiesAsAdult(verification.verifiedCustomer.birthDate)) {
      return response.status(403).json({ code: 'UNDERAGE', message: '19세 미만 청소년은 이용할 수 없습니다.' });
    }

    const token = createAdultToken();
    response.setHeader('Set-Cookie', serializeAdultCookie(token));
    return response.status(200).json({ verified: true });
  } catch (error) {
    return response.status(500).json({ message: '성인인증 처리 중 오류가 발생했습니다.' });
  }
};
