const crypto = require('crypto');
const { clientIp, checkRateLimit, rateLimitHeaders, tooManyRequestsResponse } = require('./_lib/rate-limit');
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

  const ip = clientIp(event);

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

  // Segundo límite por correo (se guarda un hash, no la dirección): evita que
  // se inscriba en masa la dirección de otra persona desde varias IPs.
  const huella = crypto.createHash('sha256')
    .update(email.trim().toLowerCase()).digest('hex').slice(0, 24);
  const limitePorCorreo = await checkRateLimit('mail-' + huella, 'subscribe');
  if (!limitePorCorreo.allowed) {
    const base = tooManyRequestsResponse(limitePorCorreo);
    return { ...base, headers: { ...base.headers, ...CORS_HEADERS } };
  }

  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) {
    console.error('subscribe: falta BREVO_API_KEY');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({ success: false, error: 'Servicio no disponible por ahora' }),
    };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
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
