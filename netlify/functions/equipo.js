// Puerta del panel de reservas (Netlify manda aquí /privado/*; ver netlify.toml).
//
// El panel NO está entre los archivos públicos del sitio: su HTML, CSS y JS viajan dentro de esta función
// (_lib/panel-archivos.generated.js, que arma preparar-publicacion.js) y solo se entregan a quien pasó la puerta:
//   1. dirección con el tramo secreto PANEL_RUTA (si no coincide, responde 404 como cualquier página inexistente),
//   2. código de acceso (PANEL_CLAVE) + código de 6 dígitos del autenticador (PANEL_TOTP_SECRET) o uno de respaldo,
//   3. cookie firmada (PANEL_COOKIE_SECRET) que dura unas horas.
// Los intentos fallidos se cuentan por IP y en total, y se bloquean. Los datos de las reservas siguen protegidos
// aparte: el panel los pide al Apps Script con el inicio de sesión de Google.
// Si falta cualquier variable, la puerta queda cerrada (nunca abierta).
const A = require('./_lib/panel-acceso');

const DURACION_SESION_SEG = 8 * 60 * 60;
const VENTANA_MS = 15 * 60 * 1000;
const MAX_FALLOS_IP = 5;          // por IP en 15 min
const MAX_FALLOS_TOTAL = 30;      // entre todas las IP en 1 h
const VENTANA_TOTAL_MS = 60 * 60 * 1000;

// Misma política de contenido que tenía /panel-reservas.html (estilos en línea: los pide el botón de Google).
const CSP_PANEL = "default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; font-src 'self'; img-src 'self' data: https: blob:; connect-src 'self' https://script.google.com https://script.googleusercontent.com https://accounts.google.com/gsi/; frame-src https://accounts.google.com/gsi/; frame-ancestors 'none'; form-action 'self'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests";
const CSP_PUERTA = "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";

const CABECERAS_BASE = {
  'Cache-Control': 'no-store, private',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',   // con no-referrer el navegador manda Origin: null en el formulario
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function paginaPuerta({ error, aviso } = {}) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive"><meta name="referrer" content="same-origin">
<title>Acceso · Kairal</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f1e8;color:#2b2a26;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:20px}
main{width:100%;max-width:400px;background:#fff;border-radius:16px;padding:32px 28px;box-shadow:0 10px 40px rgba(60,45,20,.12)}
.marca{font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:13px;color:#b9770e;margin:0 0 6px}
h1{font-size:24px;line-height:1.2;margin:0 0 6px}p.sub{margin:0 0 22px;color:#6a665c;font-size:15px}
label{display:block;font-weight:600;font-size:14px;margin:16px 0 6px}
input{width:100%;font:inherit;padding:12px 14px;border:1.5px solid #d9d2c3;border-radius:10px;background:#fffdf9;color:inherit}
input:focus{outline:3px solid #f59b1b55;border-color:#f59b1b}
.ayuda{font-size:13px;color:#7b776c;margin:6px 0 0}
button{width:100%;margin-top:24px;font:inherit;font-weight:600;padding:13px;border:0;border-radius:10px;background:#2b2a26;color:#fff;cursor:pointer}
button:hover{background:#000}
.error{background:#fdecea;color:#8a1c12;border-radius:10px;padding:11px 14px;font-size:14px;margin:0 0 4px}
.aviso{background:#fff6e0;color:#6b4a00;border-radius:10px;padding:11px 14px;font-size:14px;margin:0 0 4px}
</style></head><body><main>
<p class="marca">Kairal</p><h1>Acceso privado</h1>
<p class="sub">Solo para el equipo de la consulta.</p>
${error ? `<p class="error" role="alert">${esc(error)}</p>` : ''}${aviso ? `<p class="aviso" role="status">${esc(aviso)}</p>` : ''}
<form method="post" autocomplete="off">
<label for="clave">Código de acceso</label>
<input id="clave" name="clave" type="password" autocomplete="current-password" required autofocus>
<label for="otp">Código del autenticador</label>
<input id="otp" name="otp" type="text" inputmode="text" autocomplete="one-time-code" maxlength="20" required>
<p class="ayuda">Los 6 dígitos de tu app (Google Authenticator, Microsoft Authenticator o Authy). Si no tienes el teléfono, usa un código de respaldo.</p>
<button type="submit">Entrar</button>
</form></main></body></html>`;
}

const ROBOTS_404 = { 'Content-Type': 'text/html; charset=utf-8', ...CABECERAS_BASE };
const respuesta404 = () => ({ statusCode: 404, headers: ROBOTS_404, body: '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>No encontrado</title><meta name="robots" content="noindex"></head><body><h1>404</h1><p>Página no encontrada.</p></body></html>' });

function tipoDe(nombre) {
  if (nombre.endsWith('.css')) return 'text/css; charset=utf-8';
  if (nombre.endsWith('.js')) return 'text/javascript; charset=utf-8';
  return 'text/html; charset=utf-8';
}

function crearManejador({ env = process.env, ahora = () => Date.now(), obtenerStore, archivos } = {}) {
  const cargarArchivos = () => {
    if (archivos) return archivos;
    try { return require('./_lib/panel-archivos.generated.js'); } catch (_) { return null; }
  };

  return async function handler(event) {
    const secretos = {
      ruta: (env.PANEL_RUTA || '').trim(),
      clave: env.PANEL_CLAVE || '',
      totp: (env.PANEL_TOTP_SECRET || '').trim(),
      cookie: env.PANEL_COOKIE_SECRET || '',
      respaldo: String(env.PANEL_RESPALDO || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
    };
    const configurado = /^[a-z0-9-]{12,}$/i.test(secretos.ruta) && secretos.clave.length >= 8
      && secretos.totp.length >= 16 && secretos.cookie.length >= 32;

    // Dirección pedida (Netlify entrega la original en rawUrl / path)
    let ruta;
    try { ruta = new URL(event.rawUrl || ('https://x' + event.path)).pathname; } catch (_) { ruta = event.path || ''; }
    const base = `/privado/${secretos.ruta}`;
    if (!configurado || !(ruta === base || ruta.startsWith(base + '/'))) return respuesta404();
    if (ruta === base) return { statusCode: 301, headers: { Location: base + '/', ...CABECERAS_BASE }, body: '' };
    const sub = ruta.slice(base.length + 1);
    const ahoraMs = ahora();
    const cabeceras = Object.fromEntries(Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const metodo = event.httpMethod;

    // Cerrar sesión
    if (sub === 'salir') {
      return { statusCode: 303, headers: { Location: base + '/', 'Set-Cookie': `kairal_panel=; Path=${base}/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`, ...CABECERAS_BASE }, body: '' };
    }

    const sesion = A.cookieValida(secretos.cookie, A.leerCookies(cabeceras.cookie).kairal_panel, ahoraMs);

    /* ── Entrega del panel, solo con sesión ── */
    if (metodo === 'GET' && sesion) {
      const todo = cargarArchivos();
      if (!todo) return { statusCode: 503, headers: ROBOTS_404, body: 'Panel no disponible' };
      const nombre = sub === '' ? 'panel-reservas.html' : sub;
      if (!['panel-reservas.html', 'panel-reservas.css', 'panel-reservas.js'].includes(nombre)) return respuesta404();
      let cuerpo = todo[nombre];
      if (nombre.endsWith('.html')) {   // lo que no es del panel (logo, tipografías) se pide al sitio público, ya abierto
        cuerpo = cuerpo.replace('href="Kairallogo.svg"', 'href="/Kairallogo.svg"').replace('href="fonts/fonts.css"', 'href="/fonts/fonts.css"');
      }
      const h = { 'Content-Type': tipoDe(nombre), ...CABECERAS_BASE };
      if (nombre.endsWith('.html')) h['Content-Security-Policy'] = CSP_PANEL;
      return { statusCode: 200, headers: h, body: cuerpo };
    }

    /* ── Puerta ── */
    const puerta = (estado, datos) => ({ statusCode: estado, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': CSP_PUERTA, ...CABECERAS_BASE }, body: paginaPuerta(datos) });
    if (metodo === 'GET') return puerta(200);
    if (metodo !== 'POST') return { statusCode: 405, headers: { Allow: 'GET, POST', ...CABECERAS_BASE }, body: '' };

    // Solo formularios enviados desde esta misma página
    const origen = cabeceras.origin || '';
    const anfitrion = cabeceras['x-forwarded-host'] || cabeceras.host || '';
    let origenOk = cabeceras['sec-fetch-site'] === 'same-origin';   // lo pone el navegador; una página ajena no puede falsearlo
    try { origenOk = origenOk || new URL(origen).host === anfitrion; } catch (_) {}
    if (!origenOk) return puerta(403, { error: 'No se pudo comprobar el origen de la solicitud. Recarga la página e intenta de nuevo.' });

    let store;
    try { store = await obtenerStore(event); } catch (e) { console.error('equipo: sin almacén', e && e.message); }
    if (!store) return puerta(503, { error: 'La puerta no está disponible por ahora. Intenta en unos minutos.' });

    const ip = (cabeceras['x-nf-client-connection-ip'] || '').trim() || (cabeceras['x-forwarded-for'] || '').split(',')[0].trim() || '0.0.0.0';
    const claveIp = 'ip-' + A.sha256(ip).slice(0, 24);
    const leer = async (k) => { try { return await store.get(k, { type: 'json' }); } catch (_) { return null; } };
    const escribir = (k, v, ttl) => store.set(k, JSON.stringify(v), { ttl });

    // Se anota el intento ANTES de comprobar (si llegan varios a la vez, todos cuentan); si entra bien, se borra.
    const cuenta = async (k, max, ventana) => {
      let r = await leer(k);
      if (!r || ahoraMs >= r.hasta) r = { n: 0, hasta: ahoraMs + ventana };
      r.n += 1;
      await escribir(k, r, Math.ceil((r.hasta - ahoraMs) / 1000) + 5);
      return { ok: r.n <= max, minutos: Math.max(1, Math.ceil((r.hasta - ahoraMs) / 60000)) };
    };
    try {
      const porIp = await cuenta(claveIp, MAX_FALLOS_IP, VENTANA_MS);
      const total = await cuenta('total', MAX_FALLOS_TOTAL, VENTANA_TOTAL_MS);
      if (!porIp.ok || !total.ok) {
        return puerta(429, { aviso: `Demasiados intentos. Espera ${(porIp.ok ? total : porIp).minutos} minuto(s) y vuelve a probar.` });
      }

      const datos = A.leerFormulario(event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body);
      const claveOk = A.iguales(datos.clave || '', secretos.clave);

      // Segundo factor: el código del autenticador o uno de respaldo. Se evalúan los dos siempre.
      const ultimo = await leer('totp-ultimo');
      const contador = A.verificarTotp(secretos.totp, datos.otp, ahoraMs, ultimo && Number.isInteger(ultimo.c) ? ultimo.c : -1);
      const huella = A.huellaRespaldo(datos.otp);
      const esRespaldo = A.normalizarRespaldo(datos.otp).length >= 8 && secretos.respaldo.includes(huella);
      const respaldoUsado = esRespaldo ? await leer('respaldo-' + huella.slice(0, 16)) : null;
      const respaldoOk = esRespaldo && !respaldoUsado;
      const segundoOk = contador !== null || respaldoOk;

      if (!(claveOk && segundoOk)) return puerta(401, { error: 'Código incorrecto. Revisa los dos campos e intenta de nuevo.' });

      if (contador !== null) await escribir('totp-ultimo', { c: contador }, 300);
      else await escribir('respaldo-' + huella.slice(0, 16), { en: ahoraMs }, 60 * 60 * 24 * 365 * 5);
      await store.delete(claveIp).catch(() => {});

      return {
        statusCode: 303,
        headers: { Location: base + '/', 'Set-Cookie': `kairal_panel=${A.firmarCookie(secretos.cookie, ahoraMs, DURACION_SESION_SEG)}; Path=${base}/; Max-Age=${DURACION_SESION_SEG}; HttpOnly; Secure; SameSite=Strict`, ...CABECERAS_BASE },
        body: '',
      };
    } catch (e) {
      console.error('equipo: error', e && e.message);
      return puerta(503, { error: 'La puerta no está disponible por ahora. Intenta en unos minutos.' });   // ante un fallo, cerrada
    }
  };
}

// Almacén real (Netlify Blobs). En funciones de este tipo hay que conectar el evento antes de usarlo.
async function almacenNetlify(event) {
  const blobs = require('@netlify/blobs');
  if (typeof blobs.connectLambda === 'function') blobs.connectLambda(event);
  return blobs.getStore({ name: 'panel-acceso', consistency: 'strong' });
}

exports.handler = crearManejador({ obtenerStore: almacenNetlify });
exports.crearManejador = crearManejador;
