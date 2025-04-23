# Security Features & Privy Integration

This document outlines the security features implemented in the Passkey Authentication Backend and its integration with Privy.

## Security Features

### 1. Rate Limiting

The application implements two levels of rate limiting using Redis:

- **Global Rate Limit**:
  - 100 requests per 15 minutes per IP address
  - Applied to all routes
  - Headers: `X-RateLimit-Limit` and `X-RateLimit-Remaining`

- **Authentication Rate Limit**:
  - 5 requests per hour per IP address
  - Applied specifically to `/api/auth/*` endpoints
  - Prevents brute force attacks on authentication endpoints

### 2. Security Headers

The following security headers are automatically added to all responses:

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables browser XSS filtering
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` - Forces HTTPS
- `Permissions-Policy` - Controls browser features:
  - Disabled: geolocation, camera, microphone, payment, USB
  - Enabled: fullscreen (self only)
  - Disabled: FLoC (interest-cohort)
- Cache Control Headers:
  - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
  - `Pragma: no-cache`
  - `Expires: 0`

### 3. JWT Security

The JWT implementation includes several security features:

- **Key Rotation**:
  - Automatic key rotation every 24 hours
  - Keys remain valid for 48 hours to allow for rotation overlap
  - Multiple active keys supported in JWKS endpoint

- **Token Features**:
  - Unique token IDs (jti) for each token
  - Issued at (iat) timestamps
  - Configurable expiration time
  - RS256 algorithm for signing

- **Token Revocation**:
  - Tokens can be revoked individually
  - Revocation status checked on every verification
  - Distributed revocation list using Redis

### 4. CORS Configuration

- Whitelisted origins:
  - Your API domain
  - Privy domains (auth.privy.io, console.privy.io)
  - Local development (localhost:3000)
- Specific allowed methods and headers
- Credentials support enabled

## Privy Integration

### Overview

The backend integrates with Privy using JWT-based authentication. This allows users to maintain their existing passkey authentication while gaining access to Privy's embedded wallets.

### JWT Configuration

1. **Token Claims**:
   - `sub`: User ID (required by Privy)
   - `credentialID`: Passkey credential ID
   - `iat`: Issued at timestamp
   - `jti`: Unique token ID

2. **JWKS Endpoint**:
   - Available at `/.well-known/jwks.json`
   - Provides public keys for JWT verification
   - Automatically updates with key rotation

### Setup Instructions

1. **Privy Dashboard Configuration**:
   - Go to Privy Dashboard
   - Select your app
   - Navigate to User Management > Authentication > JWT-based auth
   - Provide your JWKS endpoint URL: `https://your-domain.com/.well-known/jwks.json`
   - Set JWT ID Claim to `sub`

2. **Environment Variables**:
   ```
   API_BASE_URL=https://your-api-domain.com
   API_RP_ID=your-rp-id
   JWT_SECRET=your-jwt-secret
   APP_ID=your-app-id
   ```

### Authentication Flow

1. User authenticates with passkey
2. Backend issues JWT with user ID in `sub` claim
3. Privy verifies JWT using public key from JWKS endpoint
4. User gains access to Privy's embedded wallet

### Security Considerations

1. **Key Management**:
   - Keys are automatically rotated
   - Old keys are automatically cleaned up
   - Keys are stored securely in memory

2. **Token Security**:
   - Tokens are signed with RS256
   - Tokens include unique IDs
   - Tokens can be revoked if compromised

3. **Rate Limiting**:
   - Authentication endpoints are protected
   - Prevents brute force attacks
   - Uses Redis for distributed rate limiting

## Best Practices

1. **Environment Security**:
   - Use HTTPS in production
   - Keep environment variables secure
   - Regularly rotate secrets

2. **Monitoring**:
   - Monitor rate limit hits
   - Monitor failed authentication attempts
   - Monitor token revocations

3. **Maintenance**:
   - Keep dependencies updated
   - Regularly review security headers
   - Monitor Privy's status and updates

## Troubleshooting

1. **Rate Limiting Issues**:
   - Check Redis connection
   - Verify rate limit configuration
   - Check rate limit headers in responses

2. **JWT Issues**:
   - Verify JWKS endpoint accessibility
   - Check token claims
   - Verify key rotation

3. **Privy Integration Issues**:
   - Verify JWKS endpoint URL
   - Check token format
   - Verify `sub` claim presence 