const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS filter in browser
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Control browser features
  res.setHeader('Permissions-Policy', [
    'geolocation=()',
    'camera=()',
    'microphone=()',
    'payment=()',
    'usb=()',
    'fullscreen=(self)',
    'interest-cohort=()'
  ].join(', '));
  
  // Only apply cache control headers to non-API routes
  if (!req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

module.exports = securityHeaders; 