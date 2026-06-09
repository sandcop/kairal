const { getStore } = require('@netlify/blobs');

const LIMITS = {
  subscribe:         { max: 5,  windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  reviews:           { max: 60, windowMs: 60 * 1000 },       // 60 per minute
  'notify-blog':     { max: 10, windowMs: 60 * 1000 },       // 10 per minute
  'notify-resource': { max: 10, windowMs: 60 * 1000 },       // 10 per minute
};

// Note: Netlify Blobs has no atomic increment. Concurrent requests within the same
// window may both read count=N and both write count=N+1 (effective +1 instead of +2).
// This is an accepted trade-off for this low-traffic site — the race is unlikely to
// matter in practice and the fail-open catch block is the primary protection here.
async function checkRateLimit(ip, endpoint) {
  const config = LIMITS[endpoint] || { max: 20, windowMs: 60 * 1000 };
  const now = Date.now();
  let record = { count: 0, resetAt: now + config.windowMs };

  try {
    const store = getStore({ name: 'rate-limits', consistency: 'strong' });
    const key = `${endpoint}:${ip}`;

    const existing = await store.get(key, { type: 'json' });
    if (existing && now < existing.resetAt) {
      record = existing;
    }

    record.count += 1;
    const ttl = Math.ceil((record.resetAt - now) / 1000);
    // store.set with JSON.stringify + store.get with { type: 'json' } is the
    // correct round-trip for @netlify/blobs — the SDK parses on read.
    await store.set(key, JSON.stringify(record), { ttl });
  } catch (_) {
    // Blobs unavailable (local dev without netlify dev --linked) — fail open
    return { allowed: true, limit: config.max, remaining: config.max, resetAt: now + config.windowMs, retryAfter: 0 };
  }

  const allowed = record.count <= config.max;
  return {
    allowed,
    limit: config.max,
    remaining: Math.max(0, config.max - record.count),
    resetAt: record.resetAt,
    retryAfter: allowed ? 0 : Math.ceil((record.resetAt - now) / 1000),
  };
}

function rateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

function tooManyRequestsResponse(result) {
  return {
    statusCode: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(result.retryAfter),
      ...rateLimitHeaders(result),
    },
    body: JSON.stringify({ error: 'Demasiadas solicitudes. Intenta más tarde.' }),
  };
}

module.exports = { checkRateLimit, rateLimitHeaders, tooManyRequestsResponse };
