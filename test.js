var request = require('request');

var headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:72.0) Gecko/20100101 Firefox/72.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://hitomi.la',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
};

var options = {
    url: 'https://ca.hitomi.la/images/0/ef/703448e1923e250ddbf4aed0f270b2106109b88433437ad4e80186d2e1bf2ef0.jpg',
    headers: headers
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
}

request(options, callback);
