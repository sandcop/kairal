const { checkRateLimit, rateLimitHeaders, tooManyRequestsResponse } = require('./_lib/rate-limit');

const PLACE_ID = 'ChIJW0aRzc5yryoRL3Al-vO2J0I';

exports.handler = async function(event) {
  const ip = (event.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || event.headers['client-ip']
           || '0.0.0.0';

  const CORS_ORIGIN = 'https://kairal.cl';

  const rateLimit = await checkRateLimit(ip, 'reviews');
  if (!rateLimit.allowed) {
    const base = tooManyRequestsResponse(rateLimit);
    return { ...base, headers: { ...base.headers, 'Access-Control-Allow-Origin': CORS_ORIGIN } };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,reviews,user_ratings_total&language=es&key=${process.env.GOOGLE_PLACES_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': CORS_ORIGIN,
        ...rateLimitHeaders(rateLimit),
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('Google Places error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': CORS_ORIGIN },
      body: JSON.stringify({ error: 'Error al obtener reseñas' }),
    };
  }
};
