# ⚠️ WARNING: INTERNAL USE ONLY ⚠️

This codebase is not production ready and is intended for internal use only. It has not undergone a full security audit and should not be used in production environments without proper review and testing.

# Passkey Authentication Backend

A reusable Node.js backend service for WebAuthn/Passkey authentication.

## Features

- WebAuthn/Passkey registration and authentication
- JWT-based session management
- Redis integration for session management
- Rate limiting and security headers
- Modular architecture for easy extension

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── models/         # Data models
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utility functions
├── app.js         # Express application setup
└── server.js      # Server entry point
```

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- Yarn or npm
- Redis instance (for session management)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   yarn install
   ```
3. Copy the example environment file and update with your values:
   ```
   cp .env.example .env
   ```
4. Start the development server:
   ```
   yarn dev
   ```

### Environment Variables

Create a `.env` file with the following variables:

```
API_BASE_URL=https://your-api-domain.com
API_RP_ID=your-rp-id
JWT_SECRET=your-jwt-secret
UPSTASH_REDIS_URL=your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token
```

## Documentation

- [API Documentation](docs/API.md)
- [Security Features](docs/SECURITY.md)
- [Authentication Flow](docs/AUTH_FLOW.md)

## Development

### Running Tests

```
yarn test
```

For development with watch mode:
```
yarn test:watch
```

### Linting

```
yarn lint
```

## Deployment

### General Deployment

The application is designed to be deployed to any Node.js hosting environment. For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2 or Docker
3. Set up HTTPS (required for WebAuthn)
4. Configure a reverse proxy if needed

## Security

This project implements several security features including:
- Rate limiting
- Security headers
- JWT session management
- CORS protection

For detailed security documentation, see [SECURITY.md](docs/SECURITY.md).

## License

ISC
