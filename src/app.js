const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const cors = require('./middleware/cors.middleware');
const errorHandler = require('./middleware/error.middleware');
const rateLimit = require('./middleware/rate-limit.middleware');
const securityHeaders = require('./middleware/security-headers.middleware');
const authRoutes = require('./routes/api/auth.routes');
const docsRoutes = require('./routes/api/docs.routes');
const jwksRoutes = require('./routes/api/jwks.routes');
const authController = require('./controllers/auth.controller');

const app = express();

// Body parsing - must be first
app.use(bodyParser.json());

// API content type middleware
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Security middleware
app.use(securityHeaders);
app.use(cors);

// Rate limiting configuration
const rateLimits = {
  // Global rate limit for all routes
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  // Stricter rate limiting for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // limit each IP to 15 requests per 15 minutes
    keyPrefix: 'auth-rate-limit',
    message: 'Too many authentication attempts, please try again later.'
  },
  // Rate limiting for certificate refresh
  certRefresh: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per hour
    keyPrefix: 'cert-refresh-rate-limit',
    message: 'Too many certificate refresh attempts, please try again later.'
  },
  // Rate limiting for initial certificate
  initialCert: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3, // limit each IP to 3 requests per day
    keyPrefix: 'initial-cert-rate-limit',
    message: 'Too many initial certificate requests, please try again later.'
  }
};

// Apply rate limiting
app.use(rateLimit(rateLimits.global));

// Stricter rate limiting for auth endpoints
app.use('/api/auth', rateLimit(rateLimits.auth));

// Rate limiting for certificate endpoints
app.use('/api/auth/refresh-certificate', rateLimit(rateLimits.certRefresh));
app.use('/api/auth/initial-certificate', rateLimit(rateLimits.initialCert));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/docs', docsRoutes);
app.use('/.well-known/jwks.json', jwksRoutes);

// Apple App Site Association
app.get('/.well-known/apple-app-site-association', authController.getAppleAppSiteAssociation);

// Error handling
app.use(errorHandler);

module.exports = app; 