require('dotenv').config();

const config = {
  app: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    baseUrl: process.env.API_BASE_URL,
    rpId: process.env.API_RP_ID,
    appId: process.env.APP_ID,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h',
  },
  redis: {
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  },
  webauthn: {
    rpName: 'Passkey Authentication',
    rpID: process.env.API_RP_ID?.trim().toLowerCase(),
    origin: process.env.API_BASE_URL?.trim(),
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      requireResidentKey: true,
      residentKey: 'required',
      userVerification: 'preferred',
    },
  },
};

// Validate required environment variables
const requiredEnvVars = {
  API_BASE_URL: config.app.baseUrl,
  API_RP_ID: config.app.rpId,
  JWT_SECRET: config.jwt.secret,
  APP_ID: config.app.appId,
  UPSTASH_REDIS_URL: config.redis.url,
  UPSTASH_REDIS_TOKEN: config.redis.token,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  console.error('Please copy .env.example to .env and fill in the required values');
  process.exit(1);
}

// Validate rpID format
if (config.webauthn.rpID?.includes('https://') || config.webauthn.rpID?.includes('http://')) {
  console.error('Error: RP ID should not include protocol (http:// or https://)');
  console.error('Current RP ID:', config.webauthn.rpID);
  console.error('Please update API_RP_ID in your .env file');
  process.exit(1);
}

// Validate origin format
if (!config.webauthn.origin?.startsWith('https://')) {
  console.error('Error: API_BASE_URL must use HTTPS protocol');
  console.error('Current API_BASE_URL:', config.webauthn.origin);
  console.error('Please update API_BASE_URL in your .env file');
  process.exit(1);
}

module.exports = config; 