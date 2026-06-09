const { checkRateLimit, rateLimitHeaders, tooManyRequestsResponse } = require('./_lib/rate-limit');
const { subscribeSchema, validateBody } = require('./_lib/validate');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://kairal.cl',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...CORS_HEADERS }, body: 'Method Not Allowed' };
  }

  const ip = (event.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || event.headers['client-ip']
           || '0.0.0.0';

  const rateLimit = await checkRateLimit(ip, 'subscribe');
  if (!rateLimit.allowed) {
    const base = tooManyRequestsResponse(rateLimit);
    return { ...base, headers: { ...base.headers, ...CORS_HEADERS } };
  }

  const validation = validateBody(subscribeSchema, event.body);
  if (!validation.success) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateLimitHeaders(rateLimit) },
      body: JSON.stringify({ success: false, error: validation.error }),
    };
  }

  const { email, firstName, lastName, recurso } = validation.data;

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: firstName, LASTNAME: lastName, RECURSO_DESCARGADO: recurso },
        listIds: [2],
        updateEnabled: true,
      }),
    });

    console.log('Brevo subscribe status:', response.status);

    if (!response.ok) {
      console.error('Brevo error status:', response.status);
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify({ success: false, error: 'Error al procesar la solicitud' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateLimitHeaders(rateLimit) },
      body: JSON.stringify({ success: true }),
    };

  } catch (err) {
    console.error('Brevo fetch error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({ success: false, error: 'Error al procesar la solicitud' }),
    };
  }
};
