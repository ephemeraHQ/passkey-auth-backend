const http = require('http');
const app = require('./app');
const config = require('./config');

// Create the server
const server = http.createServer(app);

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(config.app.port, '0.0.0.0', () => {
    console.log(`Server listening on port ${config.app.port}`);
    console.log('WebAuthn configuration:');
    console.log(`- RP Name: ${config.webauthn.rpName}`);
    console.log(`- RP ID: ${config.webauthn.rpID}`);
    console.log(`- Origin: ${config.webauthn.origin}`);
    console.log(`- App ID: ${config.app.appId}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });
}

// Export the server for Vercel
module.exports = server; 