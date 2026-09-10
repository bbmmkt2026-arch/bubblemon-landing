module.exports = function ageConfig(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ message: 'Method not allowed.' });
  }

  const storeId = process.env.PORTONE_STORE_ID;
  const channelKey = process.env.PORTONE_CHANNEL_KEY;
  if (!storeId || !channelKey) {
    return response.status(503).json({ message: 'Adult verification is not configured.' });
  }

  return response.status(200).json({ storeId, channelKey });
};
