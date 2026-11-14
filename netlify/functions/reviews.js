const { clientIp, checkRateLimit, rateLimitHeaders, tooManyRequestsResponse } = require('./_lib/rate-limit');

const PLACE_ID = 'ChIJW0aRzc5yryoRL3Al-vO2J0I';
const CORS_ORIGIN = 'https://kairal.cl';

// Places API (New). La versión clásica dejó de servir esta ficha (responde "Place ID no longer
// valid" aunque Google Maps la usa), por eso se consulta la nueva. La clave va en un encabezado,
// no en la URL, y solo se piden los campos que se muestran.
const URL_PLACES = `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=es`;
const CAMPOS = 'reviews.rating,reviews.text,reviews.authorAttribution';

// Las reseñas cambian poco: se guardan 1 hora en la función y en el CDN de
// Netlify, así cada visita no es una llamada pagada a Google. Si Google
// responde con error, se guarda 10 minutos para no insistir en cada visita.
const CACHE_OK_S = 3600;
const CACHE_ERROR_S = 600;
let cache = null;   // { body, hasta, ok }

// Solo lo que usa la página (script.js), con el mismo formato de antes: nada de mensajes de error
// de Google ni campos que no se muestran. Las reseñas sin texto se omiten (no se inventa una frase).
function resumen(data) {
  if (!data || !Array.isArray(data.reviews)) return { status: 'ERROR' };
  return {
    status: 'OK',
    result: {
      reviews: data.reviews
        .filter(r => r && r.text && String(r.text.text || '').trim())
        .map(r => ({
          author_name: (r.authorAttribution && r.authorAttribution.displayName) || '',
          rating: r.rating,
          text: String(r.text.text).trim(),
          profile_photo_url: (r.authorAttribution && r.authorAttribution.photoUri) || '',
        })),
    },
  };
}

function respuesta(body, ok, extra) {
  const segundos = ok ? CACHE_OK_S : CACHE_ERROR_S;
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Netlify-CDN-Cache-Control': `public, durable, s-maxage=${segundos}, stale-while-revalidate=86400`,
      ...(extra || {}),
    },
    body,
  };
}

exports.handler = async function(event) {
  if (cache && Date.now() < cache.hasta) return respuesta(cache.body, cache.ok);

  const rateLimit = await checkRateLimit(clientIp(event), 'reviews');
  if (!rateLimit.allowed) {
    const base = tooManyRequestsResponse(rateLimit);
    return { ...base, headers: { ...base.headers, 'Access-Control-Allow-Origin': CORS_ORIGIN } };
  }

  const key = (process.env.GOOGLE_PLACES_KEY || '').trim();
  let datos = { status: 'ERROR' };
  if (!key) {
    console.error('reviews: falta GOOGLE_PLACES_KEY');
  } else {
    try {
      const res = await fetch(URL_PLACES, { headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': CAMPOS } });
      const google = await res.json();
      if (!res.ok) console.error('Google Places:', res.status, (google.error && google.error.status) || '');
      datos = resumen(res.ok ? google : null);
    } catch (err) {
      console.error('Google Places error:', err.message);
    }
  }

  const ok = datos.status === 'OK';
  const body = JSON.stringify(datos);
  cache = { body, ok, hasta: Date.now() + (ok ? CACHE_OK_S : CACHE_ERROR_S) * 1000 };
  return respuesta(body, ok, rateLimitHeaders(rateLimit));
};
