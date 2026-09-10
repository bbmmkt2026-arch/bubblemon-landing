const crypto = require('node:crypto');

const COOKIE_NAME = 'bbm_adult';
const SESSION_SECONDS = 60 * 60 * 12;

function getSessionSecret() {
  const secret = process.env.AGE_SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;

  const apiSecret = process.env.PORTONE_API_SECRET;
  if (!apiSecret) {
    throw new Error('PORTONE_API_SECRET or AGE_SESSION_SECRET is required.');
  }

  return crypto
    .createHash('sha256')
    .update('bbmkr-age-session-v1\0')
    .update(apiSecret)
    .digest();
}

function createAdultToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ v: 1, adult: true, iat: now, exp: now + SESSION_SECONDS }))
    .toString('base64url');
  const signature = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function serializeAdultCookie(token) {
  return [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${SESSION_SECONDS}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax'
  ].join('; ');
}

module.exports = {
  COOKIE_NAME,
  createAdultToken,
  serializeAdultCookie
};
