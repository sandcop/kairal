/* ============================================================================
   Autoevaluación funcional · entrega del informe
   1. Da de alta el contacto en Brevo (misma lista que la suscripción).
   2. Le envía su informe por correo (API transaccional de Brevo).

   El cliente solo manda su correo y los puntajes. Todo el texto del informe
   sale de autoeval-contenido.js aquí en el servidor, así nadie puede usar
   este endpoint para enviar correos con contenido propio.
   ========================================================================== */

const crypto = require('crypto');
const { checkRateLimit, rateLimitHeaders, tooManyRequestsResponse } = require('./_lib/rate-limit');
const { autoevalSchema, validateBody } = require('./_lib/validate');
const CONTENIDO = require('../../autoeval-contenido.js');

const LISTA_BREVO = 2;
const REMITENTE = { name: 'Dra. Yusneily Sánchez | Kairal', email: 'dra.yusneily@kairal.cl' };
const AGENDA = 'https://encuadrado.com/p/dra-yusneily-katherine-sanchez';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://kairal.cl',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// El nombre va también al campo "to.name" del correo, que termina en una
// cabecera. Los saltos de línea y los caracteres de control se quitan para
// que no haya forma de inyectar cabeceras (Bcc, etc.) desde ahí.
function nombreLimpio(valor) {
  return String(valor || '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')   // control, CR, LF, TAB
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

function json(statusCode, body, extra) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...(extra || {}) },
    body: JSON.stringify(body),
  };
}

// ── Correo del informe ─────────────────────────────────────────────────────
// HTML de email: tablas y estilos en línea, que es lo único que renderizan
// bien Gmail y Outlook.
function bloqueSistema(d) {
  const c = d.contenido;
  const acciones = (c.acciones || []).map(a => `
    <tr>
      <td valign="top" style="padding:0 8px 8px 0;color:${d.banda.color};font-weight:700;">•</td>
      <td valign="top" style="padding:0 0 8px;color:#4a5658;font-size:15px;line-height:1.6;">${esc(a)}</td>
    </tr>`).join('');

  const evaluar = (c.evaluar || []).length ? `
    <div style="margin-top:16px;padding:14px 16px;background:#F7FAF9;border-radius:10px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#1A7A75;">
        Qué conviene evaluar en consulta
      </p>
      ${c.evaluar.map(e => `<p style="margin:0 0 6px;color:#4a5658;font-size:14px;line-height:1.55;">— ${esc(e)}</p>`).join('')}
    </div>` : '';

  return `
  <tr><td style="padding:0 0 14px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #E4EEED;border-radius:14px;border-left:4px solid ${d.banda.color};">
      <tr><td style="padding:20px 22px;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:19px;font-weight:800;color:#1A7A75;">${esc(d.nombre)}</td>
            <td align="right" style="white-space:nowrap;font-size:20px;font-weight:800;color:${d.banda.color};">
              ${d.puntaje}<span style="font-size:13px;color:#96A0A2;font-weight:600;">/${d.maximo}</span>
            </td>
          </tr>
        </table>

        <p style="margin:10px 0 0;">
          <span style="display:inline-block;padding:5px 12px;border-radius:100px;background:${d.banda.color};
                       color:#ffffff;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
            ${esc(d.banda.etiqueta)}
          </span>
          <span style="display:inline-block;margin-left:6px;padding:5px 12px;border-radius:100px;
                       background:#F1F7F6;color:#4a5658;font-size:11px;font-weight:700;
                       letter-spacing:.06em;text-transform:uppercase;">
            ${esc(d.banda.urgencia)}
          </span>
        </p>

        <p style="margin:14px 0 0;color:#2D3436;font-size:15px;line-height:1.65;">${esc(c.lectura)}</p>

        <p style="margin:12px 0 0;padding:12px 14px;background:#FFF8EC;border-radius:10px;
                  color:#6b5426;font-size:14px;line-height:1.6;">
          <strong style="color:#B87400;">Por qué importa:</strong> ${esc(c.porque)}
        </p>

        <p style="margin:16px 0 8px;font-size:12px;font-weight:700;letter-spacing:.1em;
                  text-transform:uppercase;color:#1A7A75;">Qué hacer</p>
        <table role="presentation" cellpadding="0" cellspacing="0">${acciones}</table>

        <p style="margin:14px 0 0;font-size:13px;color:#96A0A2;">
          <strong style="color:#4a5658;">Plazo sugerido:</strong> ${esc(d.banda.plazo)}
        </p>

        ${evaluar}
      </td></tr>
    </table>
  </td></tr>`;
}

function emailHtml(inf, nombre) {
  const saludo = nombre ? `Hola ${esc(nombre)},` : 'Hola,';
  const p = inf.principal;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu autoevaluación funcional</title></head>
<body style="margin:0;padding:0;background:#F7FAF9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7FAF9;">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0"
       style="width:100%;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;
              font-family:'Nunito',Helvetica,Arial,sans-serif;">

  <tr><td align="center" style="padding:30px 24px 10px;">
    <img src="https://kairal.cl/Kairallogo-email.png" alt="Kairal" width="72"
         style="height:auto;border:0;display:block;">
  </td></tr>

  <tr><td style="padding:8px 30px 0;">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.24em;
              text-transform:uppercase;color:#F59B1B;">Autoevaluación funcional</p>
    <h1 style="margin:8px 0 0;font-size:26px;line-height:1.25;color:#1A7A75;font-weight:800;">
      Tu perfil funcional
    </h1>
    <p style="margin:14px 0 0;color:#4a5658;font-size:15px;line-height:1.7;">
      ${saludo} este es el resultado de tu autoevaluación. Está ordenado por prioridad:
      arriba lo que más conviene atender.
    </p>
  </td></tr>

  <tr><td style="padding:22px 30px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#1A7A75;border-radius:14px;">
      <tr><td style="padding:20px 22px;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;
                  text-transform:uppercase;color:#9FD8D4;">Sistema con mayor puntaje</p>
        <p style="margin:6px 0 0;font-size:23px;font-weight:800;color:#ffffff;">${esc(p.corto)}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#CFE9E7;">
          ${p.puntaje} de ${p.maximo} · ${esc(p.banda.etiqueta)} · ${esc(p.banda.urgencia)}
        </p>
        <p style="margin:14px 0 0;padding-top:14px;border-top:1px solid rgba(255,255,255,.22);
                  font-size:15px;line-height:1.65;color:#EAF6F5;">
          <strong style="color:#ffffff;">${esc(inf.conjunto.titulo)}.</strong> ${esc(inf.conjunto.texto)}
        </p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:24px 30px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${inf.ordenados.map(bloqueSistema).join('')}
    </table>
  </td></tr>

  <tr><td align="center" style="padding:12px 30px 4px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#FFF8EC;border-radius:14px;">
      <tr><td align="center" style="padding:24px;">
        <p style="margin:0 0 6px;font-size:18px;font-weight:800;color:#1A7A75;">
          ¿Quieres saber la causa de fondo?
        </p>
        <p style="margin:0 0 18px;color:#4a5658;font-size:14px;line-height:1.6;">
          En consulta revisamos tu historia completa y los estudios necesarios para
          entender por qué ocurre y qué hacer al respecto.
        </p>
        <a href="${AGENDA}"
           style="display:inline-block;background:#F59B1B;color:#ffffff;text-decoration:none;
                  padding:14px 32px;border-radius:100px;font-weight:800;font-size:15px;">
          Agenda tu evaluación
        </a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:20px 30px 0;">
    <p style="margin:0;padding:14px 16px;background:#F7FAF9;border-radius:10px;
              color:#96A0A2;font-size:12px;line-height:1.6;">${esc(CONTENIDO.DESCARGO)}</p>
  </td></tr>

  <tr><td align="center" style="padding:24px 30px 30px;">
    <p style="margin:0;color:#96A0A2;font-size:13px;line-height:1.7;">
      <strong style="color:#4a5658;">Dra. Yusneily Sánchez</strong><br>
      Medicina General · Funcional · Bioreguladora<br>
      <a href="https://kairal.cl" style="color:#48B9B3;text-decoration:none;">kairal.cl</a>
      &nbsp;·&nbsp; Antofagasta, Chile
    </p>
    <p style="margin:14px 0 0;color:#B2BEC3;font-size:11px;line-height:1.6;">
      Recibes este correo porque pediste tu informe en kairal.cl.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// Versión en texto plano: mejora la entregabilidad y sirve a quien lee sin HTML.
function emailTexto(inf, nombre) {
  const l = [];
  l.push((nombre ? `Hola ${nombre},` : 'Hola,'));
  l.push('');
  l.push('Este es el resultado de tu autoevaluación funcional, ordenado por prioridad.');
  l.push('');
  l.push(`SISTEMA CON MAYOR PUNTAJE: ${inf.principal.corto} ` +
         `(${inf.principal.puntaje}/${inf.principal.maximo}) — ${inf.principal.banda.etiqueta}`);
  l.push('');
  l.push(`${inf.conjunto.titulo}. ${inf.conjunto.texto}`);
  l.push('');
  for (const d of inf.ordenados) {
    l.push('='.repeat(58));
    l.push(`${d.nombre.toUpperCase()} — ${d.puntaje}/${d.maximo}`);
    l.push(`${d.banda.etiqueta} · ${d.banda.urgencia}`);
    l.push('');
    l.push(d.contenido.lectura);
    l.push('');
    l.push(`Por qué importa: ${d.contenido.porque}`);
    l.push('');
    l.push('Qué hacer:');
    (d.contenido.acciones || []).forEach(a => l.push(`  - ${a}`));
    if ((d.contenido.evaluar || []).length) {
      l.push('');
      l.push('Qué conviene evaluar en consulta:');
      d.contenido.evaluar.forEach(e => l.push(`  - ${e}`));
    }
    l.push('');
    l.push(`Plazo sugerido: ${d.banda.plazo}`);
    l.push('');
  }
  l.push('='.repeat(58));
  l.push('');
  l.push(`Agenda tu evaluación: ${AGENDA}`);
  l.push('');
  l.push(CONTENIDO.DESCARGO);
  l.push('');
  l.push('Dra. Yusneily Sánchez · Kairal · kairal.cl');
  return l.join('\n');
}

// ── Llamadas a Brevo ───────────────────────────────────────────────────────
async function brevo(ruta, cuerpo, apiKey) {
  return fetch('https://api.brevo.com/v3' + ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify(cuerpo),
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...CORS_HEADERS }, body: 'Method Not Allowed' };
  }

  // x-nf-client-connection-ip la pone Netlify y el cliente no puede falsearla.
  // x-forwarded-for sí es manipulable, así que solo se usa como respaldo.
  const ip = (event.headers['x-nf-client-connection-ip'] || '').trim()
           || (event.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || event.headers['client-ip'] || '0.0.0.0';

  const rateLimit = await checkRateLimit(ip, 'autoeval-result');
  if (!rateLimit.allowed) {
    const base = tooManyRequestsResponse(rateLimit);
    return { ...base, headers: { ...base.headers, ...CORS_HEADERS } };
  }

  const validation = validateBody(autoevalSchema, event.body);
  if (!validation.success) {
    return json(400, { success: false, error: validation.error }, rateLimitHeaders(rateLimit));
  }

  const { email, firstName, scores } = validation.data;

  // Segundo límite por destinatario: evita que se use este endpoint para
  // bombardear el correo de otra persona desde varias IPs. Se guarda un hash,
  // no la dirección.
  const huella = crypto.createHash('sha256')
    .update(email.trim().toLowerCase()).digest('hex').slice(0, 24);
  const limitePorCorreo = await checkRateLimit('mail-' + huella, 'autoeval-result');
  if (!limitePorCorreo.allowed) {
    const base = tooManyRequestsResponse(limitePorCorreo);
    return { ...base, headers: { ...base.headers, ...CORS_HEADERS } };
  }
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) {
    console.error('autoeval-result: falta BREVO_API_KEY');
    return json(500, { success: false, error: 'Servicio no disponible por ahora' });
  }

  // El informe se calcula aquí, no llega del cliente.
  const inf = CONTENIDO.informe(scores);
  const nombre = nombreLimpio(firstName);

  // 1) Alta del contacto. Solo atributos que ya existen en la cuenta de Brevo
  //    (FIRSTNAME / RECURSO_DESCARGADO), para no depender de configuración nueva.
  //    Si falla, seguimos: el informe se envía igual.
  //    Nota: el resultado de la evaluación NO se guarda en ninguna parte del
  //    servidor. Solo viaja en el correo que recibe la propia persona.
  try {
    const resContacto = await brevo('/contacts', {
      email,
      // A propósito NO se guarda el resultado de la evaluación: qué sistema
      // salió afectado es información de salud y no tiene por qué vivir en
      // una plataforma de marketing. Solo queda el origen del contacto.
      attributes: { FIRSTNAME: nombre, RECURSO_DESCARGADO: 'Autoevaluación funcional' },
      listIds: [LISTA_BREVO],
      updateEnabled: true,
    }, apiKey);
    console.log('autoeval contacto Brevo:', resContacto.status);
  } catch (err) {
    console.error('autoeval contacto Brevo error:', err.message);
  }

  // 2) Envío del informe. Esto sí es crítico: es lo que la persona pidió.
  try {
    const resEnvio = await brevo('/smtp/email', {
      sender: REMITENTE,
      replyTo: REMITENTE,
      to: [{ email, name: nombre || email }],
      // Asunto neutro a propósito: aparece en los registros de Brevo y en la
      // pantalla del teléfono de quien lo recibe. El resultado va dentro.
      subject: nombre ? `${nombre}, aquí está tu informe funcional`
                      : 'Aquí está tu informe funcional',
      htmlContent: emailHtml(inf, nombre),
      textContent: emailTexto(inf, nombre),
      tags: ['autoevaluacion'],
    }, apiKey);

    if (!resEnvio.ok) {
      console.error('autoeval envío Brevo status:', resEnvio.status);
      return json(502, { success: false, error: 'No pudimos enviar el correo. Intenta de nuevo.' });
    }

    return json(200, { success: true }, rateLimitHeaders(rateLimit));

  } catch (err) {
    console.error('autoeval envío error:', err.message);
    return json(500, { success: false, error: 'Error al procesar la solicitud' });
  }
};
