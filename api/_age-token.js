const crypto = require('node:crypto');

const COOKIE_NAME = 'bbm_adult';
const SESSION_SECONDS = 60 * 60 * 12;

function getSessionSecret() {
  const secret = process.env.AGE_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AGE_SESSION_SECRET must be at least 32 characters.');
  }
  return secret;
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
