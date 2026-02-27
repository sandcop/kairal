exports.handler = async function(event) {
    const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_KEY;
    const PLACE_ID = 'ChIJW9rJelQqrpYRMhzt6voouQE';

    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,reviews,user_ratings_total&language=es&key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': 'https://kairal.cl' },
            body: JSON.stringify(data)
        };
    } catch(err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
