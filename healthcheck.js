// Simple healthcheck for Docker container
// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  console.log(`Healthcheck status: ${res.statusCode}`);
  if (res.statusCode >= 200 && res.statusCode < 500) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('Healthcheck failed:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('Healthcheck timeout');
  request.destroy();
  process.exit(1);
});

request.end();
