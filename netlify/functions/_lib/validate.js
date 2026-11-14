// Validación de lo que mandan los formularios. Sin librerías: son dos formularios chicos y así no hay
// dependencias que vigilar. Cada esquema devuelve { data } con SOLO los campos esperados (lo demás se descarta)
// o { error } con el mensaje para mostrar.

const CORREO = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

function correo(v) {
  return typeof v === 'string' && v.length <= 254 && CORREO.test(v);
}
// texto opcional con largo máximo: si no viene, queda vacío
function texto(v, max) {
  if (v === undefined) return { ok: true, valor: '' };
  if (typeof v !== 'string' || v.length > max) return { ok: false };
  return { ok: true, valor: v };
}
function entero(v, min, max) {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}
const esObjeto = v => v !== null && typeof v === 'object' && !Array.isArray(v);

function subscribeSchema(b) {
  if (!esObjeto(b) || !correo(b.email)) return { error: 'Formato de email inválido' };
  const firstName = texto(b.firstName, 100), lastName = texto(b.lastName, 100), recurso = texto(b.recurso, 200);
  if (!firstName.ok || !lastName.ok || !recurso.ok) return { error: 'Datos inválidos' };
  return { data: { email: b.email, firstName: firstName.valor, lastName: lastName.valor, recurso: recurso.valor } };
}

// Autoevaluación funcional: el cliente manda su correo y el puntaje de cada
// sistema. Nunca manda texto del informe — ese lo construye el servidor a
// partir de autoeval-contenido.js, para que no se pueda inyectar contenido.
const MAXIMOS = { dig: 21, neuro: 21, inmune: 18, metab: 18 };
function autoevalSchema(b) {
  if (!esObjeto(b) || !correo(b.email)) return { error: 'Formato de email inválido' };
  const firstName = texto(b.firstName, 100);
  if (!firstName.ok) return { error: 'Datos inválidos' };
  if (b.consent !== true) return { error: 'Falta aceptar el envío del informe' };
  if (!esObjeto(b.scores)) return { error: 'Datos inválidos' };
  const scores = {};
  for (const k of Object.keys(MAXIMOS)) {
    if (!entero(b.scores[k], 0, MAXIMOS[k])) return { error: 'Datos inválidos' };
    scores[k] = b.scores[k];
  }
  let answered = 0;
  if (b.answered !== undefined) {
    if (!entero(b.answered, 0, 26)) return { error: 'Datos inválidos' };
    answered = b.answered;
  }
  return { data: { email: b.email, firstName: firstName.valor, consent: true, scores, answered } };
}

function validateBody(schema, rawBody) {
  let parsed;
  try {
    parsed = typeof rawBody === 'string' ? JSON.parse(rawBody || '{}') : rawBody;
  } catch (_) {
    return { success: false, error: 'JSON inválido' };
  }
  const r = schema(parsed);
  return r.error ? { success: false, error: r.error } : { success: true, data: r.data };
}

module.exports = { subscribeSchema, autoevalSchema, validateBody };
