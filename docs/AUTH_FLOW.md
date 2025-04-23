# Authentication Flow Diagrams

This document illustrates the authentication flows in the Passkey Authentication Backend, including both the passkey registration/login flow and the Privy integration flow.

## Passkey Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Server
    participant Redis
    participant Browser

    User->>Client: Enter display name
    Client->>Server: GET /api/challenge/register?displayName=...
    Server->>Redis: Store challenge
    Server-->>Client: Return registration options
    Client->>Browser: Start registration
    Browser->>User: Prompt for passkey creation
    User->>Browser: Create passkey
    Browser-->>Client: Return attestation
    Client->>Server: POST /api/register-passkey
    Server->>Redis: Verify challenge
    Server->>Redis: Store credential
    Server->>Server: Generate JWT
    Server-->>Client: Return JWT token
    Client->>Client: Store JWT token
```

## Passkey Login Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Server
    participant Redis
    participant Browser

    User->>Client: Click login
    Client->>Server: GET /api/challenge/login
    Server->>Redis: Store challenge
    Server-->>Client: Return authentication options
    Client->>Browser: Start authentication
    Browser->>User: Prompt for passkey
    User->>Browser: Select passkey
    Browser-->>Client: Return authentication
    Client->>Server: POST /api/login-passkey
    Server->>Redis: Verify challenge
    Server->>Redis: Get credential
    Server->>Redis: Update counter
    Server->>Server: Generate JWT
    Server-->>Client: Return JWT token
    Client->>Client: Store JWT token
```

## JWT Key Rotation Flow

```mermaid
sequenceDiagram
    participant Server
    participant Redis
    participant Client
    participant Privy

    Note over Server: Every 24 hours
    Server->>Server: Generate new key pair
    Server->>Server: Set as current key
    Note over Server: Old keys remain valid for 48 hours
    Server->>Server: Clean up expired keys
    Note over Server: JWKS endpoint includes all valid keys
    Client->>Server: Request JWKS
    Server-->>Client: Return all valid keys
    Client->>Privy: Use JWT with key ID
    Privy->>Server: Verify JWT using JWKS
```

## Token Revocation Flow

```mermaid
sequenceDiagram
    participant Admin
    participant Server
    participant Redis
    participant Client

    Admin->>Server: Revoke token
    Server->>Redis: Delete token from valid tokens
    Note over Client: Next request with revoked token
    Client->>Server: Request with revoked token
    Server->>Redis: Check token validity
    Redis-->>Server: Token not found
    Server-->>Client: 401 Unauthorized
```

## Privy Integration Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Server
    participant Privy
    participant Wallet

    User->>Client: Login with passkey
    Client->>Server: Authenticate
    Server-->>Client: Return JWT
    Client->>Privy: Initialize with JWT
    Privy->>Server: Verify JWT via JWKS
    Server-->>Privy: Valid JWT
    Privy->>Wallet: Create/access wallet
    Wallet-->>User: Wallet ready
```

## Rate Limiting Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Redis

    Client->>Server: Make request
    Server->>Redis: Increment request count
    Redis-->>Server: Current count
    alt Count > Limit
        Server-->>Client: 429 Too Many Requests
    else Count <= Limit
        Server->>Server: Process request
        Server-->>Client: Normal response
    end
```

## Security Headers Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Browser

    Client->>Server: Make request
    Server->>Server: Add security headers
    Server-->>Client: Response with headers
    Client->>Browser: Process response
    Note over Browser: Headers enforce security policies
    Note over Browser: - Prevent clickjacking
    Note over Browser: - Enable XSS protection
    Note over Browser: - Force HTTPS
    Note over Browser: - Control feature access
```

## Environment Setup

```mermaid
graph TD
    A[Clone Repository] --> B[Install Dependencies]
    B --> C[Copy .env.example]
    C --> D[Configure Environment Variables]
    D --> E[Start Development Server]
    
    subgraph Environment Variables
        D1[API_BASE_URL]
        D2[API_RP_ID]
        D3[JWT_SECRET]
        D4[APP_ID]
        D5[UPSTASH_REDIS_URL]
        D6[UPSTASH_REDIS_TOKEN]
    end
    
    D --> D1
    D --> D2
    D --> D3
    D --> D4
    D --> D5
    D --> D6
```

## Deployment Architecture

```mermaid
graph TD
    A[Client] -->|HTTPS| B[Load Balancer]
    B --> C[Node.js Server 1]
    B --> D[Node.js Server 2]
    B --> E[Node.js Server N]
    C --> F[Redis]
    D --> F
    E --> F
    
    subgraph Security
        G[Rate Limiting]
        H[JWT Verification]
        I[Security Headers]
        J[CORS]
    end
    
    C --> G
    C --> H
    C --> I
    C --> J
    
    D --> G
    D --> H
    D --> I
    D --> J
    
    E --> G
    E --> H
    E --> I
    E --> J
``` 