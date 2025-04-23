# Passkey Authentication API Documentation

This document provides an overview of the Passkey Authentication API endpoints and how to use them.

## Base URL

```
https://your-api-domain.com
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. After successful registration or login, a JWT token is returned which should be included in subsequent requests in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Registration

#### Get Registration Challenge

```
GET /api/challenge/register?displayName=<user_display_name>
```

**Query Parameters:**
- `displayName` (required): The display name for the user

**Response:**
```json
{
  "challenge": "base64url-encoded-challenge",
  "rp": {
    "name": "Passkey Authentication",
    "id": "your-rp-id"
  },
  "user": {
    "id": "base64url-encoded-user-id",
    "name": "user_display_name",
    "displayName": "user_display_name"
  },
  "pubKeyCredParams": [
    {
      "alg": -7,
      "type": "public-key"
    },
    {
      "alg": -257,
      "type": "public-key"
    }
  ],
  "timeout": 60000,
  "attestation": "none",
  "authenticatorSelection": {
    "authenticatorAttachment": "platform",
    "requireResidentKey": true,
    "residentKey": "required",
    "userVerification": "preferred"
  }
}
```

#### Register Passkey

```
POST /api/register-passkey
```

**Request Body:**
```json
{
  "attestationResponse": {
    "id": "credential-id",
    "rawId": "base64url-encoded-raw-id",
    "response": {
      "clientDataJSON": "base64url-encoded-client-data",
      "attestationObject": "base64url-encoded-attestation-object"
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token"
}
```

### Login

#### Get Login Challenge

```
GET /api/challenge/login
```

**Response:**
```json
{
  "challenge": "base64url-encoded-challenge",
  "timeout": 60000,
  "rpId": "your-rp-id",
  "allowCredentials": [],
  "userVerification": "preferred"
}
```

#### Login with Passkey

```
POST /api/login-passkey
```

**Request Body:**
```json
{
  "authenticationResponse": {
    "id": "credential-id",
    "rawId": "base64url-encoded-raw-id",
    "response": {
      "clientDataJSON": "base64url-encoded-client-data",
      "authenticatorData": "base64url-encoded-authenticator-data",
      "signature": "base64url-encoded-signature",
      "userHandle": "base64url-encoded-user-handle"
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token"
}
```

### Apple App Site Association

```
GET /.well-known/apple-app-site-association
```

**Response:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "your-app-id",
        "paths": ["*"],
        "components": [
          {
            "/": "/*",
            "comment": "Matches all URLs"
          }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["your-app-id"]
  }
}
```

## Error Responses

The API returns standard HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication failed
- `500 Internal Server Error`: Server error

Error responses include a JSON object with an `error` field:

```json
{
  "error": "Error message description"
}
```

## Client Implementation

To implement a client for this API, you'll need to:

1. Call the registration/login challenge endpoints to get the challenge
2. Use the Web Authentication API in the browser to create/verify credentials
3. Send the attestation/authentication response to the server
4. Store the JWT token for subsequent authenticated requests

## Future Enhancements

- Database integration for persistent storage of credentials
- User management endpoints (update profile, delete account)
- Rate limiting and additional security measures
- Support for multiple credentials per user
- Session management 