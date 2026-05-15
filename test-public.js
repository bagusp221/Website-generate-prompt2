import https from "https";

const data = JSON.stringify({
  customer: "Test",
  format: "Prompt Profesional",
  lang: "🇮🇩 Indonesia"
});

const options = {
  hostname: 'ais-dev-5neo45v77gbo6rscxccyjd-62961794733.asia-southeast1.run.app',
  port: 443,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', chunk => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', e => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
