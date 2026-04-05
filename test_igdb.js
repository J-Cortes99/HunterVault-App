const https = require('https');

const clientId = 'c6fcqgad60xkqhftwa6cjiob45onls';
const clientSecret = 'kmev0tv3w57msm1c1nkn6hi7tllhqz';

async function fetchIgdb() {
    return new Promise((resolve) => {
        const authReq = https.request(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, { method: 'POST' }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', async () => {
                const token = JSON.parse(data).access_token;
                
                const getJson = (url, body) => new Promise((resJson) => {
                    const req = https.request(url, {
                        method: 'POST',
                        headers: {
                            'Client-ID': clientId,
                            'Authorization': `Bearer ${token}`
                        }
                    }, (r) => {
                        let d = '';
                        r.on('data', c => d += c);
                        r.on('end', () => resJson(JSON.parse(d)));
                    });
                    req.write(body);
                    req.end();
                });

                const ttbData = await getJson('https://api.igdb.com/v4/game_time_to_beats', `fields *; limit 1;`);
                
                resolve({ ttb: ttbData });
            });
        });
        authReq.end();
    });
}

fetchIgdb().then(res => console.log(JSON.stringify(res, null, 2)));
