const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');
const { clientIp, checkRateLimit, rateLimitHeaders, tooManyRequestsResponse } = require('./_lib/rate-limit');

// Aviso a la lista de suscriptores (Brevo, lista 2) cuando se publica un artículo en Sanity.
// - Sanity llama a esta función con un webhook firmado: solo se acepta con la firma correcta.
// - Cada artículo se avisa UNA sola vez (aunque después se edite o Sanity vuelva a llamar):
//   se anota en Netlify Blobs antes de enviar.
// - Los borradores y otros tipos de documento se ignoran.

const LISTA_SUSCRIPTORES = 2;
const VENTANA_FIRMA_MS = 5 * 60 * 1000;   // una firma más vieja que esto no se acepta (evita reenvíos)
const ANTIGUEDAD_MAX_MS = 3 * 24 * 3600 * 1000;   // solo se avisan artículos publicados hace menos de 3 días

// Formato oficial de Sanity (@sanity/webhook): "t=<ms>,v1=<HMAC-SHA256 en base64url de `${t}.${cuerpo}`>"
function verifyWebhookSignature(body, signatureHeader, secret, ahora = Date.now()) {
    if (!signatureHeader || !secret || !body) return false;
    const m = /^t=(\d+)[, ]+v1=([^, ]+)$/.exec(String(signatureHeader).trim());
    if (!m) return false;
    const ts = Number(m[1]);
    if (!Number.isFinite(ts) || Math.abs(ahora - ts) > VENTANA_FIRMA_MS) return false;
    const esperada = crypto.createHmac('sha256', secret).update(`${m[1]}.${body}`).digest('base64url');
    const a = Buffer.from(m[2]), b = Buffer.from(esperada);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function json(statusCode, obj) {
    return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
}

function correo(titulo, extracto, url) {
    return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px 16px;background:#F3EEE4;font-family:Arial,Helvetica,sans-serif;color:#1A2421;">
  <div style="max-width:600px;margin:0 auto;background:#FFFDF8;border:1px solid #E8DFCF;border-radius:18px;overflow:hidden;">
    <div style="background:#081F1D;padding:26px 32px;">
      <img src="https://kairal.cl/Kairallogo-email.png" alt="Kairal" style="height:52px;display:block;">
      <p style="margin:18px 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7FB5AB;font-weight:bold;">Nuevo artículo</p>
      <h1 style="margin:0;font-size:22px;line-height:1.3;color:#EDE5D6;">${esc(titulo)}</h1>
    </div>
    <div style="height:3px;background:#F2A65A;"></div>
    <div style="padding:26px 32px;">
      <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#4A5753;">${esc(extracto)}</p>
      <a href="${esc(url)}" style="display:inline-block;background:#0E7C6B;color:#ffffff;padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:14px;">Leer el artículo</a>
      <p style="margin:28px 0 0;font-size:13px;line-height:1.7;color:#4A5753;">Con cariño,<br><strong style="color:#081F1D;">Dra. Yusneily Sánchez</strong><br>Kairal · Medicina funcional · <a href="https://kairal.cl" style="color:#0E7C6B;">kairal.cl</a></p>
    </div>
    <div style="background:#081F1D;padding:14px 32px;">
      <p style="margin:0;font-size:11px;line-height:1.6;color:#7FB5AB;">Recibes este correo porque te suscribiste en kairal.cl. <a href="{{unsubscribe}}" style="color:#7FB5AB;">Darme de baja</a></p>
    </div>
  </div>
</body></html>`;
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const rateLimit = await checkRateLimit(clientIp(event), 'notify-blog');
    if (!rateLimit.allowed) {
        return tooManyRequestsResponse(rateLimit);
    }

    // La firma se calcula sobre el cuerpo tal como llegó (Netlify puede entregarlo en base64)
    const cuerpo = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');

    // Sin secreto configurado se rechaza todo: esta función envía una campaña
    // a toda la lista, no puede quedar abierta por olvido.
    const headers = event.headers || {};
    const sig = headers['sanity-webhook-signature'] || headers['Sanity-Webhook-Signature'] || '';
    if (!verifyWebhookSignature(cuerpo, sig, process.env.SANITY_WEBHOOK_SECRET)) {
        return json(401, { error: 'Invalid webhook signature' });
    }

    let post;
    try { post = JSON.parse(cuerpo); }
    catch (err) { return json(400, { error: 'Invalid JSON' }); }

    if (!post || !post.slug || !post.slug.current) return json(200, { message: 'Sin slug: no se avisa' });
    if (String(post._id || '').startsWith('drafts.')) return json(200, { message: 'Borrador: no se avisa' });
    if (post._type && post._type !== 'post') return json(200, { message: 'No es un artículo: no se avisa' });
    // Un artículo publicado hace días no es "nuevo": así, editar uno antiguo no lo reenvía a la lista
    const publicado = Date.parse(post.publishedAt || post._createdAt || '');
    if (Number.isFinite(publicado) && Date.now() - publicado > ANTIGUEDAD_MAX_MS) {
        return json(200, { message: 'Artículo publicado hace más de 3 días: no se avisa' });
    }

    // Una sola vez por artículo (por su id de Sanity; si no viene, por su slug)
    const clave = String(post._id || post.slug.current).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 200);
    const avisos = getStore({ name: 'avisos-blog', consistency: 'strong' });
    if (await avisos.get(clave)) return json(200, { message: 'Este artículo ya se avisó: no se repite' });
    await avisos.setJSON(clave, { slug: post.slug.current, enviando: new Date().toISOString() });

    const titulo = post.title || 'Nuevo artículo en Kairal';
    const extracto = post.excerpt || 'La Dra. Yusneily publicó un nuevo artículo sobre medicina funcional.';
    const url = `https://kairal.cl/blog/${encodeURIComponent(post.slug.current)}`;
    const brevo = { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY || '' };

    try {
        const crear = await fetch('https://api.brevo.com/v3/emailCampaigns', {
            method: 'POST', headers: brevo,
            body: JSON.stringify({
                name: `Blog: ${titulo}`.slice(0, 200),
                subject: `Nuevo artículo: ${titulo}`,
                sender: { name: 'Dra. Yusneily Sánchez | Kairal', email: 'dra.yusneily@kairal.cl' },
                type: 'classic',
                htmlContent: correo(titulo, extracto, url),
                recipients: { listIds: [LISTA_SUSCRIPTORES] },
            }),
        });
        const data = await crear.json().catch(() => ({}));
        if (!crear.ok || !data.id) throw new Error('Brevo no creó la campaña (' + crear.status + ')');
        const enviar = await fetch(`https://api.brevo.com/v3/emailCampaigns/${data.id}/sendNow`, { method: 'POST', headers: brevo });
        if (!enviar.ok) throw new Error('Brevo no envió la campaña ' + data.id + ' (' + enviar.status + ')');
        await avisos.setJSON(clave, { slug: post.slug.current, campana: data.id, enviado: new Date().toISOString() });
        console.log('notify-blog: campaña enviada', data.id, post.slug.current);
        return json(200, { success: true, campaignId: data.id });
    } catch (err) {
        // Si falló, se quita la marca para que el próximo aviso de Sanity lo intente de nuevo
        await avisos.delete(clave).catch(() => {});
        console.error('notify-blog error:', err.message);
        return json(500, { success: false, error: 'Error al procesar la solicitud' });
    }
};

exports._probar = { verifyWebhookSignature };
