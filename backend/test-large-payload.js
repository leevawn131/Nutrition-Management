const http = require('http');

const data = JSON.stringify({ base64_image: 'A'.repeat(60 * 1024 * 1024) });

const options = {
  hostname: '192.168.1.7',
  port: 5000,
  path: '/api/meals/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => responseBody += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${responseBody.substring(0, 500)}`);
  });
});

req.on('error', (e) => console.error(`Problem with request: ${e.message}`));
req.write(data);
req.end();
