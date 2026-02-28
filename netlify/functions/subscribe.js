exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let email, firstName, lastName, recurso;

    try {
        const body = JSON.parse(event.body || '{}');
        email = body.email;
        firstName = body.firstName || '';
        lastName = body.lastName || '';
        recurso = body.recurso || '';
    } catch(err) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, error: 'Invalid JSON: ' + err.message })
        };
    }

    if (!email) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, error: 'Email is required' })
        };
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                email,
                attributes: {
                    FIRSTNAME: firstName,
                    LASTNAME: lastName,
                    RECURSO_DESCARGADO: recurso
                },
                listIds: [2],
                updateEnabled: true
            })
        });

        const data = await response.json();
        console.log('Brevo status:', response.status, JSON.stringify(data));

        return {
            statusCode: 200,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ success: true, data })
        };

    } catch(err) {
        console.log('Fetch error:', err.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: err.message })
        };
    }
};
