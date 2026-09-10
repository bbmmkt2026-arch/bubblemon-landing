module.exports = function ageConfig(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ message: 'Method not allowed.' });
  }

  const storeId = process.env.PORTONE_STORE_ID || 'store-6d1ff12b-ed08-4bb5-a855-55ef48a0eff4';
  const channelKey = process.env.PORTONE_CHANNEL_KEY || 'channel-key-15334675-ffc3-4b16-9b75-c6ef94acd03e';
  if (!storeId || !channelKey) {
    return response.status(503).json({ message: 'Adult verification is not configured.' });
  }

  return response.status(200).json({ storeId, channelKey });
};
