exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let recurso;
    try {
        recurso = JSON.parse(event.body || '{}');
    } catch(err) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const title = recurso.title || 'Nuevo recurso gratuito en Kairal';
    const description = recurso.description || 'Tenemos un nuevo recurso gratuito para ti.';
    const fileUrl = recurso.fileUrl || 'https://kairal.cl/#recursos';
    const emoji = recurso.emoji || '🎁';

    try {
        const response = await fetch('https://api.brevo.com/v3/emailCampaigns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                name: `Recurso: ${title}`,
                subject: `${emoji} Nuevo recurso gratuito: ${title}`,
                sender: {
                    name: 'Dra. Yusneily Sánchez | Kairal',
                    email: 'dra.yusneily@kairal.cl'
                },
                type: 'classic',
                htmlContent: `
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #2D3436;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <img src="https://kairal.cl/Kairallogo.svg" alt="Kairal" style="height: 50px;">
                        </div>
                        <h1 style="color: #F59B1B; font-size: 1.8rem; margin-bottom: 10px;">${emoji} Nuevo recurso gratuito para ti</h1>
                        <h2 style="color: #2D3436; font-size: 1.4rem; margin-bottom: 15px;">${title}</h2>
                        <p style="color: #636E72; line-height: 1.8; margin-bottom: 25px;">${description}</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${fileUrl}" style="background: linear-gradient(135deg, #F59B1B, #E88A0A); color: white; padding: 14px 35px; border-radius: 25px; text-decoration: none; font-weight: 700; font-size: 1rem;">
                                Descargar gratis →
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #E9ECEF; margin: 30px 0;">
                        <p style="color: #636E72; font-size: 0.85rem; text-align: center;">
                            Con cariño,<br>
                            <strong>Dra. Yusneily Sánchez</strong><br>
                            Médico Funcional | Kairal<br>
                            <a href="https://kairal.cl" style="color: #48B9B3;">kairal.cl</a>
                        </p>
                        <p style="color: #B2BEC3; font-size: 0.75rem; text-align: center; margin-top: 20px;">
                            Recibes este correo porque te suscribiste en kairal.cl<br>
                            <a href="{{unsubscribe}}" style="color: #B2BEC3;">Darme de baja</a>
                        </p>
                    </body>
                    </html>
                `,
                recipients: { listIds: [2] },
            })
        });

        const data = await response.json();
        console.log('Campaign created:', JSON.stringify(data));

        if (data.id) {
            await fetch(`https://api.brevo.com/v3/emailCampaigns/${data.id}/sendNow`, {
                method: 'POST',
                headers: { 'api-key': process.env.BREVO_API_KEY }
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, campaignId: data.id })
        };

    } catch(err) {
        console.log('Error:', err.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: err.message })
        };
    }
};
