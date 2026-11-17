// Pruebas de la puerta del panel.  Ejecutar:  node --test netlify/functions/_lib/
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('./panel-acceso');
const { crearManejador } = require('../equipo');

// Vectores oficiales de RFC 6238 (secreto ASCII "12345678901234567890", SHA-1)
const SECRETO_RFC = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
test('TOTP: coincide con los vectores de RFC 6238', () => {
  assert.equal(A.codigoTotp(SECRETO_RFC, Math.floor(59 / 30), 8), '94287082');
  assert.equal(A.codigoTotp(SECRETO_RFC, Math.floor(1111111109 / 30), 8), '07081804');
  assert.equal(A.codigoTotp(SECRETO_RFC, Math.floor(20000000000 / 30), 8), '65353130');
});
test('base32 de ida y vuelta', () => {
  const b = Buffer.from('0123456789abcdef');
  assert.deepEqual(A.base32ADeBytes(A.bytesABase32(b)), b);
});
test('TOTP: acepta ±30 s, rechaza lo demás y no deja reutilizar el código', () => {
  const t = 1700000000000, c = Math.floor(t / 30000);
  assert.equal(A.verificarTotp(SECRETO_RFC, A.codigoTotp(SECRETO_RFC, c), t), c);
  assert.equal(A.verificarTotp(SECRETO_RFC, A.codigoTotp(SECRETO_RFC, c - 1), t), c - 1);
  assert.equal(A.verificarTotp(SECRETO_RFC, A.codigoTotp(SECRETO_RFC, c + 1), t), c + 1);
  assert.equal(A.verificarTotp(SECRETO_RFC, A.codigoTotp(SECRETO_RFC, c + 2), t), null);
  assert.equal(A.verificarTotp(SECRETO_RFC, A.codigoTotp(SECRETO_RFC, c - 2), t), null);
  assert.equal(A.verificarTotp(SECRETO_RFC, A.codigoTotp(SECRETO_RFC, c), t, c), null);   // ya usado
  assert.equal(A.verificarTotp(SECRETO_RFC, '12345', t), null);
  assert.equal(A.verificarTotp(SECRETO_RFC, 'abcdef', t), null);
  assert.equal(A.verificarTotp(SECRETO_RFC, '', t), null);
});
test('cookie: válida, vencida, alterada y de otro secreto', () => {
  const sec = 'x'.repeat(40), t = 1700000000000;
  const ck = A.firmarCookie(sec, t, 3600);
  assert.equal(A.cookieValida(sec, ck, t + 1000), true);
  assert.equal(A.cookieValida(sec, ck, t + 3601 * 1000), false);
  assert.equal(A.cookieValida(sec, ck.replace(/.$/, c => (c === 'a' ? 'b' : 'a')), t), false);
  assert.equal(A.cookieValida('y'.repeat(40), ck, t), false);
  const p = ck.split('.'); p[1] = String(Number(p[1]) + 99999);
  assert.equal(A.cookieValida(sec, p.join('.'), t), false);
  assert.equal(A.cookieValida(sec, '', t), false);
  assert.equal(A.cookieValida(sec, 'v1.1.2.3', t), false);
});

/* ─── Puerta completa, con un almacén en memoria ─── */
const RUTA = 'abc123def456ghi';
const ENTORNO = {
  PANEL_RUTA: RUTA, PANEL_CLAVE: 'clave-de-prueba-1', PANEL_TOTP_SECRET: SECRETO_RFC,
  PANEL_COOKIE_SECRET: 'c'.repeat(48),
  PANEL_RESPALDO: [A.huellaRespaldo('AAAA-BBBB'), A.huellaRespaldo('CCCC-DDDD')].join(','),
};
const ARCHIVOS = { 'panel-reservas.html': '<html><head><link rel="icon" href="Kairallogo.svg"><link rel="stylesheet" href="fonts/fonts.css"></head><body>SECRETO-PANEL</body></html>', 'panel-reservas.css': 'body{}', 'panel-reservas.js': 'console.log(1)' };
function memoria() {
  const m = new Map();
  return { async get(k) { const v = m.get(k); return v === undefined ? null : JSON.parse(v); }, async set(k, v) { m.set(k, v); }, async delete(k) { m.delete(k); } };
}
function montar(env = ENTORNO, t0 = 1700000000000) {
  const reloj = { t: t0 }, store = memoria();
  const h = crearManejador({ env, ahora: () => reloj.t, obtenerStore: async () => store, archivos: ARCHIVOS });
  const base = `/privado/${RUTA}`;
  const pedir = (metodo, sub = '/', { cuerpo, cookie, origen = 'https://kairal.cl', ip = '1.2.3.4', sitio } = {}) => h({
    httpMethod: metodo, rawUrl: `https://kairal.cl${base}${sub}`, path: base + sub, body: cuerpo,
    headers: { host: 'kairal.cl', origin: origen, cookie: cookie || '', 'x-nf-client-connection-ip': ip, ...(sitio ? { 'sec-fetch-site': sitio } : {}) },
  });
  const form = (o) => new URLSearchParams(o).toString();
  const totp = () => A.codigoTotp(SECRETO_RFC, Math.floor(reloj.t / 30000));
  const cookieDe = (r) => (r.headers['Set-Cookie'] || '').split(';')[0];
  return { h, reloj, store, pedir, form, totp, cookieDe, base };
}

test('puerta: sin sesión muestra el formulario y NUNCA el panel', async () => {
  const { pedir } = montar();
  for (const sub of ['/', '/panel-reservas.js', '/panel-reservas.css', '/panel-reservas.html']) {
    const r = await pedir('GET', sub);
    assert.equal(r.statusCode, 200);
    assert.ok(r.body.includes('Acceso privado'));
    assert.ok(!r.body.includes('SECRETO-PANEL') && !r.body.includes('console.log'));
    assert.match(r.headers['X-Robots-Tag'], /noindex/);
  }
});
test('puerta: con otro tramo en la dirección responde 404; /privado/ solo tampoco dice nada', async () => {
  const { h } = montar();
  for (const url of ['/privado/', '/privado/otra-ruta-cualquiera/', '/privado', '/privado/abc123def456gh/']) {
    const r = await h({ httpMethod: 'GET', rawUrl: 'https://kairal.cl' + url, headers: {} });
    assert.equal(r.statusCode, 404);
    assert.ok(!/Acceso privado|Kairal/.test(r.body));
  }
  const sinSlash = await h({ httpMethod: 'GET', rawUrl: `https://kairal.cl/privado/${RUTA}`, headers: {} });
  assert.equal(sinSlash.statusCode, 301);
});
test('puerta: si falta cualquier variable, queda cerrada (404)', async () => {
  for (const falta of Object.keys(ENTORNO).filter(k => k !== 'PANEL_RESPALDO')) {
    const env = { ...ENTORNO }; delete env[falta];
    const r = await montar(env).pedir('GET', '/');
    assert.equal(r.statusCode, 404, falta);
  }
  const corta = montar({ ...ENTORNO, PANEL_CLAVE: 'corta' });
  assert.equal((await corta.pedir('GET', '/')).statusCode, 404);
});
test('puerta: clave + código correctos → cookie y panel; assets solo con cookie', async () => {
  const p = montar();
  const r = await p.pedir('POST', '/', { cuerpo: p.form({ clave: ENTORNO.PANEL_CLAVE, otp: p.totp() }) });
  assert.equal(r.statusCode, 303);
  assert.match(r.headers['Set-Cookie'], /HttpOnly; Secure; SameSite=Strict/);
  assert.ok(r.headers['Set-Cookie'].includes(`Path=${p.base}/`));
  const ck = p.cookieDe(r);
  const panel = await p.pedir('GET', '/', { cookie: ck });
  assert.equal(panel.statusCode, 200);
  assert.ok(panel.body.includes('SECRETO-PANEL'));
  assert.ok(panel.body.includes('href="/Kairallogo.svg"') && panel.body.includes('href="/fonts/fonts.css"'));
  assert.match(panel.headers['Content-Security-Policy'], /accounts\.google\.com\/gsi\/client/);
  assert.equal(panel.headers['Cache-Control'], 'no-store, private');
  assert.equal((await p.pedir('GET', '/panel-reservas.js', { cookie: ck })).headers['Content-Type'], 'text/javascript; charset=utf-8');
  assert.equal((await p.pedir('GET', '/panel-reservas.css', { cookie: ck })).headers['Content-Type'], 'text/css; charset=utf-8');
  assert.equal((await p.pedir('GET', '/otro.txt', { cookie: ck })).statusCode, 404);
  assert.equal((await p.pedir('GET', '/../x', { cookie: ck })).statusCode, 404);
});
test('puerta: falla con clave mal, código mal, solo uno de los dos, o campos vacíos', async () => {
  const p = montar();
  for (const datos of [
    { clave: 'mal', otp: p.totp() }, { clave: ENTORNO.PANEL_CLAVE, otp: '000000' },
    { clave: ENTORNO.PANEL_CLAVE, otp: '' }, { clave: '', otp: p.totp() }, {}, { clave: ENTORNO.PANEL_CLAVE },
  ]) {
    const r = await p.pedir('POST', '/', { cuerpo: p.form(datos), ip: '9.9.9.' + Math.floor(Math.random() * 200) });
    assert.equal(r.statusCode, 401, JSON.stringify(datos));
    assert.ok(!r.headers['Set-Cookie']);
    assert.ok(!r.body.includes('SECRETO-PANEL'));
  }
});
test('puerta: el código del autenticador no se puede usar dos veces', async () => {
  const p = montar();
  const datos = p.form({ clave: ENTORNO.PANEL_CLAVE, otp: p.totp() });
  assert.equal((await p.pedir('POST', '/', { cuerpo: datos })).statusCode, 303);
  assert.equal((await p.pedir('POST', '/', { cuerpo: datos, ip: '5.5.5.5' })).statusCode, 401);
  p.reloj.t += 30000;   // el código de la ventana siguiente sí sirve
  assert.equal((await p.pedir('POST', '/', { cuerpo: p.form({ clave: ENTORNO.PANEL_CLAVE, otp: p.totp() }), ip: '5.5.5.5' })).statusCode, 303);
});
test('puerta: un código de respaldo sirve una sola vez (con o sin guion y en minúsculas)', async () => {
  const p = montar();
  const con = (otp, ip) => p.pedir('POST', '/', { cuerpo: p.form({ clave: ENTORNO.PANEL_CLAVE, otp }), ip });
  assert.equal((await con('aaaa-bbbb', '7.7.7.7')).statusCode, 303);
  assert.equal((await con('AAAA-BBBB', '7.7.7.8')).statusCode, 401);
  assert.equal((await con('CCCCDDDD', '7.7.7.9')).statusCode, 303);
  assert.equal((await con('EEEE-FFFF', '7.7.7.10')).statusCode, 401);
  // y el respaldo no entra sin la clave de acceso
  const p2 = montar();
  assert.equal((await p2.pedir('POST', '/', { cuerpo: p2.form({ clave: 'mal', otp: 'AAAA-BBBB' }) })).statusCode, 401);
});
test('puerta: bloquea tras 5 intentos desde la misma IP y luego se libera', async () => {
  const p = montar();
  const mal = () => p.pedir('POST', '/', { cuerpo: p.form({ clave: 'mal', otp: '111111' }), ip: '8.8.8.8' });
  for (let i = 0; i < 5; i++) assert.equal((await mal()).statusCode, 401);
  const bloqueado = await mal();
  assert.equal(bloqueado.statusCode, 429);
  // ni siquiera con los datos buenos
  const bueno = await p.pedir('POST', '/', { cuerpo: p.form({ clave: ENTORNO.PANEL_CLAVE, otp: p.totp() }), ip: '8.8.8.8' });
  assert.equal(bueno.statusCode, 429);
  assert.ok(!bueno.headers['Set-Cookie']);
  // otra IP no está bloqueada
  assert.equal((await p.pedir('POST', '/', { cuerpo: p.form({ clave: ENTORNO.PANEL_CLAVE, otp: p.totp() }), ip: '8.8.4.4' })).statusCode, 303);
  // pasados 15 min vuelve a dejar probar
  p.reloj.t += 15 * 60 * 1000 + 1000;
  assert.equal((await mal()).statusCode, 401);
});
test('puerta: tope total entre muchas IP', async () => {
  const p = montar();
  let ultimo;
  for (let i = 0; i < 31; i++) ultimo = await p.pedir('POST', '/', { cuerpo: p.form({ clave: 'mal', otp: '111111' }), ip: '10.0.0.' + i });
  assert.equal(ultimo.statusCode, 429);
});
test('puerta: rechaza formularios de otro origen o sin origen', async () => {
  const p = montar();
  const datos = p.form({ clave: ENTORNO.PANEL_CLAVE, otp: p.totp() });
  assert.equal((await p.pedir('POST', '/', { cuerpo: datos, origen: 'https://malo.example' })).statusCode, 403);
  assert.equal((await p.pedir('POST', '/', { cuerpo: datos, origen: '' })).statusCode, 403);
  assert.equal((await p.pedir('POST', '/', { cuerpo: datos, origen: 'null' })).statusCode, 403);
  assert.equal((await p.pedir('POST', '/', { cuerpo: datos, origen: 'https://malo.example', sitio: 'cross-site' })).statusCode, 403);
  // el navegador manda Origin: null cuando la página pide no enviar referencia; Sec-Fetch-Site lo respalda
  assert.equal((await p.pedir('POST', '/', { cuerpo: datos, origen: 'null', sitio: 'same-origin' })).statusCode, 303);
});
test('puerta: cookie falsa, vencida o de otra sesión no abre el panel', async () => {
  const p = montar();
  const login = await p.pedir('POST', '/', { cuerpo: p.form({ clave: ENTORNO.PANEL_CLAVE, otp: p.totp() }) });
  const ck = p.cookieDe(login);
  assert.ok((await p.pedir('GET', '/', { cookie: 'kairal_panel=inventada' })).body.includes('Acceso privado'));
  assert.ok((await p.pedir('GET', '/', { cookie: ck.slice(0, -2) + 'zz' })).body.includes('Acceso privado'));
  p.reloj.t += 8 * 3600 * 1000 + 5000;
  assert.ok((await p.pedir('GET', '/', { cookie: ck })).body.includes('Acceso privado'));
});
test('puerta: salir borra la cookie', async () => {
  const r = await montar().pedir('GET', '/salir');
  assert.equal(r.statusCode, 303);
  assert.match(r.headers['Set-Cookie'], /Max-Age=0/);
});
test('puerta: si el almacén falla, queda cerrada (no se deja pasar)', async () => {
  const h = crearManejador({ env: ENTORNO, obtenerStore: async () => { throw new Error('sin blobs'); }, archivos: ARCHIVOS });
  const r = await h({ httpMethod: 'POST', rawUrl: `https://kairal.cl/privado/${RUTA}/`, headers: { host: 'kairal.cl', origin: 'https://kairal.cl' }, body: new URLSearchParams({ clave: ENTORNO.PANEL_CLAVE, otp: A.codigoTotp(SECRETO_RFC, Math.floor(Date.now() / 30000)) }).toString() });
  assert.equal(r.statusCode, 503);
  assert.ok(!r.headers['Set-Cookie']);
});

/* ─── Modo «solo dirección secreta» (el panel ya exige iniciar sesión con Google) ─── */
const SOLO = { PANEL_RUTA: RUTA, PANEL_SOLO_RUTA: 'si' };
test('solo dirección: con la dirección correcta entrega el panel; con otra, 404', async () => {
  const p = montar(SOLO);
  for (const [sub, texto] of [['/', 'SECRETO-PANEL'], ['/panel-reservas.html', 'SECRETO-PANEL'], ['/panel-reservas.js', 'console.log'], ['/panel-reservas.css', 'body{}']]) {
    const r = await p.pedir('GET', sub);
    assert.equal(r.statusCode, 200, sub);
    assert.ok(r.body.includes(texto), sub);
    assert.match(r.headers['X-Robots-Tag'], /noindex/);
    assert.match(r.headers['Cache-Control'], /no-store/);
  }
  const html = await p.pedir('GET', '/');
  assert.match(html.headers['Content-Security-Policy'], /accounts\.google\.com\/gsi\/client/);
  assert.ok(html.body.includes('href="/Kairallogo.svg"'));
  for (const url of ['/privado/', '/privado/otra-ruta-cualquiera/', '/privado/abc123def456gh/']) {
    const r = await p.h({ httpMethod: 'GET', rawUrl: 'https://kairal.cl' + url, headers: {} });
    assert.equal(r.statusCode, 404);
  }
  assert.equal((await p.h({ httpMethod: 'GET', rawUrl: `https://kairal.cl/privado/${RUTA}`, headers: {} })).statusCode, 301);
});
test('solo dirección: archivos que no son del panel dan 404 y los POST no se aceptan', async () => {
  const p = montar(SOLO);
  assert.equal((await p.pedir('GET', '/otro-archivo.js')).statusCode, 404);
  assert.equal((await p.pedir('GET', '/../netlify.toml')).statusCode, 404);
  assert.equal((await p.pedir('POST', '/', { cuerpo: p.form({ clave: 'x' }) })).statusCode, 405);
});
test('solo dirección: sin la bandera, sin ruta válida o con datos de la puerta completa queda cerrada', async () => {
  const casos = [
    { PANEL_RUTA: RUTA },                                                   // falta la bandera
    { PANEL_RUTA: RUTA, PANEL_SOLO_RUTA: 'no' },
    { PANEL_RUTA: 'corta', PANEL_SOLO_RUTA: 'si' },                        // ruta débil
    { PANEL_SOLO_RUTA: 'si' },                                              // sin ruta
    { ...ENTORNO, PANEL_SOLO_RUTA: 'si' },                                  // ambigua: bandera + puerta completa
    { PANEL_RUTA: RUTA, PANEL_SOLO_RUTA: 'si', PANEL_CLAVE: 'clave-de-prueba-1' },   // ambigua: bandera + una variable
  ];
  for (const env of casos) {
    const r = await montar(env).pedir('GET', '/');
    assert.equal(r.statusCode, 404, JSON.stringify(Object.keys(env)));
    assert.ok(!r.body.includes('SECRETO-PANEL'));
  }
});
test('puerta completa: la bandera de solo dirección no está activa si no se pone', async () => {
  const r = await montar().pedir('GET', '/');
  assert.ok(r.body.includes('Acceso privado'));   // sigue pidiendo clave y autenticador
  assert.ok(!r.body.includes('SECRETO-PANEL'));
});
