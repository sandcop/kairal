exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { email, firstName, lastName, recurso } = JSON.parse(event.body);

        const response = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                email,
                attributes: {
                    FIRSTNAME: firstName || '',
                    LASTNAME: lastName || '',
                    RECURSO_DESCARGADO: recurso || ''
                },
                listIds: [2],
                updateEnabled: true
            })
        });

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': 'https://kairal.cl' },
            body: JSON.stringify({ success: true, data })
        };

    } catch(err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: err.message })
        };
    }
};
