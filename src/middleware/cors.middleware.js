const config = require('../config');

const cors = (req, res, next) => {
  // Allow specific origins
  const allowedOrigins = [
    config.app.baseUrl, // Your API domain
    'https://auth.privy.io', // Privy auth domain
    'https://console.privy.io', // Privy console domain
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []), // Local development
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  // Allow specific methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Allow specific headers including Privy-specific ones
  res.header('Access-Control-Allow-Headers', [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Privy-Token', // Privy-specific header
    'X-Privy-Client-ID', // Privy-specific header
  ].join(', '));

  // Allow credentials
  res.header('Access-Control-Allow-Credentials', 'true');

  // Set security headers
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

module.exports = cors; 