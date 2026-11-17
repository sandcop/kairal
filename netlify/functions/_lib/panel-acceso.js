// Piezas de la "puerta" del panel de reservas: código de 6 dígitos del autenticador (TOTP, RFC 6238), cookie firmada
// y comparaciones seguras. No toca la red ni guarda nada: todo lo que depende del entorno entra por parámetros,
// para poder probarlo sin Netlify.
const crypto = require('crypto');

const sha256 = (texto) => crypto.createHash('sha256').update(String(texto)).digest('hex');

// Comparación sin pistas de tiempo: se comparan los resúmenes SHA-256, que siempre miden lo mismo.
function iguales(a, b) {
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(),
                                crypto.createHash('sha256').update(String(b)).digest());
}

/* ─── TOTP (Google Authenticator, Microsoft Authenticator, Authy…) ─── */
const ALFABETO_B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32ADeBytes(texto) {
  const limpio = String(texto || '').toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0, valor = 0;
  const salida = [];
  for (const c of limpio) {
    const i = ALFABETO_B32.indexOf(c);
    if (i < 0) throw new Error('Secreto TOTP inválido');
    valor = (valor << 5) | i; bits += 5;
    if (bits >= 8) { salida.push((valor >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(salida);
}

function bytesABase32(buf) {
  let bits = 0, valor = 0, salida = '';
  for (const b of buf) {
    valor = (valor << 8) | b; bits += 8;
    while (bits >= 5) { salida += ALFABETO_B32[(valor >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) salida += ALFABETO_B32[(valor << (5 - bits)) & 31];
  return salida;
}

function codigoTotp(secretoB32, contador, digitos = 6) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(contador));
  const h = crypto.createHmac('sha1', base32ADeBytes(secretoB32)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digitos).padStart(digitos, '0');
}

// Acepta el código actual y el de 30 s antes o después (relojes algo desfasados).
// Devuelve el contador que coincidió (para no aceptar el mismo código dos veces) o null.
function verificarTotp(secretoB32, ingresado, ahoraMs, ultimoContador = -1) {
  const codigo = String(ingresado || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(codigo)) return null;
  const actual = Math.floor(ahoraMs / 1000 / 30);
  let encontrado = null;
  for (const c of [actual - 1, actual, actual + 1]) {
    if (iguales(codigoTotp(secretoB32, c), codigo) && c > ultimoContador) encontrado = c;   // sin salir antes: mismo tiempo siempre
  }
  return encontrado;
}

/* ─── Códigos de respaldo (de un solo uso) ─── */
const normalizarRespaldo = (t) => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const huellaRespaldo = (t) => sha256('respaldo:' + normalizarRespaldo(t));

/* ─── Cookie de sesión firmada ─── */
const base64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function firmarCookie(secreto, ahoraMs, duracionSeg) {
  const cuerpo = `v1.${Math.floor(ahoraMs / 1000) + duracionSeg}.${crypto.randomBytes(12).toString('hex')}`;
  return `${cuerpo}.${base64url(crypto.createHmac('sha256', secreto).update(cuerpo).digest())}`;
}

function cookieValida(secreto, valor, ahoraMs) {
  const partes = String(valor || '').split('.');
  if (partes.length !== 4 || partes[0] !== 'v1' || !/^\d+$/.test(partes[1])) return false;
  const cuerpo = partes.slice(0, 3).join('.');
  const esperada = base64url(crypto.createHmac('sha256', secreto).update(cuerpo).digest());
  if (!iguales(esperada, partes[3])) return false;
  return Number(partes[1]) * 1000 > ahoraMs;
}

function leerCookies(cabecera) {
  const salida = {};
  for (const trozo of String(cabecera || '').split(';')) {
    const i = trozo.indexOf('=');
    if (i > 0) salida[trozo.slice(0, i).trim()] = trozo.slice(i + 1).trim();
  }
  return salida;
}

function leerFormulario(texto) {
  const salida = {};
  for (const [k, v] of new URLSearchParams(String(texto || ''))) salida[k] = v;
  return salida;
}

module.exports = {
  sha256, iguales, base32ADeBytes, bytesABase32, codigoTotp, verificarTotp,
  normalizarRespaldo, huellaRespaldo, firmarCookie, cookieValida, leerCookies, leerFormulario,
};
