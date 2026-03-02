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
                            <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iQ2FwYV8yIiBkYXRhLW5hbWU9IkNhcGEgMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTUuNDUgMzkuODUiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuY2xzLTEgewogICAgICAgIGZpbGw6ICM0OGI5YjI7CiAgICAgIH0KCiAgICAgIC5jbHMtMiB7CiAgICAgICAgZmlsbDogI2Y1OWIxYjsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPGcgaWQ9IlBSSU5UIj4KICAgIDxnPgogICAgICA8Y2lyY2xlIGNsYXNzPSJjbHMtMiIgY3g9IjI3Ljc5IiBjeT0iMy45OCIgcj0iMy45OCIvPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0wLDM1Ljkzcy4wNC0uMDYuMDYtLjAzYy41OC43MiwzLjQ5LDMuNzksOS42LDEuNTQsNi45NC0yLjU1LDguMTYtMTAuNTYsMTAuNjMtMTUuOTgsMCwwLDIuODItNy40Niw2LjI2LTEwLjA2czUuODQtNC43OSwxNS44NC01LjU2YzguNDYtLjY2LDEyLjAzLTQuMzksMTIuOTItNS41Mi4wNS0uMDcuMTYtLjAxLjE0LjA3LS4zOSwxLjMyLTIuMTYsNS42MS04Ljg0LDcuNTYtNy45NSwyLjMyLTEwLjkxLDIuODItMTQuODUsNS43Ny0zLjk0LDIuOTYtNC45Myw0LjkzLTguNzMsMTIuODEtMy44LDcuODgtNy41MywxMS4xMi0xMS4xMiwxMi40NlMxLjM5LDQwLjY3LDAsMzUuOTNaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTMzLjY1LDIxLjQ1Yy0xLjIxLTEuMzctMi43My0zLjc2LS40OC01LjM0LDAsMCwzLjEtMS42Miw1LjM1LDMuMDMsMCwwLDEuNzYsMy4xMS45MSw4LjUyLS44NCw1LjQxLTMuMDMsOC40NS03LjExLDEwLjU5LDAsMC0xLjk0LDEuMTYtNC4yMiwxLjQ1LS4wNCwwLS4wNi0uMDYtLjAyLS4wNywxLjE5LS41NCw2LjU2LTMuMjEsNy42NS03LjY2LjQ4LTEuOTcuNTYtMy42LjQzLTQuOTUtLjItMi4wOC0xLjEzLTQuMDEtMi41MS01LjU3WiIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+" alt="Kairal" style="height:55px;">
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
