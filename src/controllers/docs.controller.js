const fs = require('fs');
const path = require('path');

class DocsController {
  getApiDocs(req, res) {
    try {
      const apiDocs = {
        openapi: '3.0.0',
        info: {
          title: 'Passkey Authentication API',
          version: '1.0.0',
          description: 'API for WebAuthn/Passkey authentication',
        },
        servers: [
          {
            url: process.env.API_BASE_URL || 'https://your-api-domain.com',
            description: 'API Server',
          },
        ],
        paths: {
          '/api/challenge/register': {
            get: {
              summary: 'Get registration challenge',
              description: 'Get a challenge for registering a new passkey',
              parameters: [
                {
                  name: 'displayName',
                  in: 'query',
                  required: true,
                  schema: {
                    type: 'string',
                  },
                  description: 'Display name for the user',
                },
              ],
              responses: {
                '200': {
                  description: 'Registration challenge',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          challenge: {
                            type: 'string',
                            description: 'Base64URL encoded challenge',
                          },
                          rp: {
                            type: 'object',
                            properties: {
                              name: {
                                type: 'string',
                              },
                              id: {
                                type: 'string',
                              },
                            },
                          },
                          user: {
                            type: 'object',
                            properties: {
                              id: {
                                type: 'string',
                              },
                              name: {
                                type: 'string',
                              },
                              displayName: {
                                type: 'string',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '/api/register-passkey': {
            post: {
              summary: 'Register passkey',
              description: 'Complete registration with a passkey',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        attestationResponse: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'string',
                            },
                            rawId: {
                              type: 'string',
                            },
                            response: {
                              type: 'object',
                              properties: {
                                clientDataJSON: {
                                  type: 'string',
                                },
                                attestationObject: {
                                  type: 'string',
                                },
                              },
                            },
                            type: {
                              type: 'string',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'Registration successful',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          success: {
                            type: 'boolean',
                          },
                          token: {
                            type: 'string',
                            description: 'JWT token',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '/api/challenge/login': {
            get: {
              summary: 'Get login challenge',
              description: 'Get a challenge for authenticating with a passkey',
              responses: {
                '200': {
                  description: 'Login challenge',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          challenge: {
                            type: 'string',
                            description: 'Base64URL encoded challenge',
                          },
                          timeout: {
                            type: 'integer',
                          },
                          rpId: {
                            type: 'string',
                          },
                          allowCredentials: {
                            type: 'array',
                            items: {
                              type: 'object',
                            },
                          },
                          userVerification: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '/api/login-passkey': {
            post: {
              summary: 'Login with passkey',
              description: 'Authenticate with a passkey',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        authenticationResponse: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'string',
                            },
                            rawId: {
                              type: 'string',
                            },
                            response: {
                              type: 'object',
                              properties: {
                                clientDataJSON: {
                                  type: 'string',
                                },
                                authenticatorData: {
                                  type: 'string',
                                },
                                signature: {
                                  type: 'string',
                                },
                                userHandle: {
                                  type: 'string',
                                },
                              },
                            },
                            type: {
                              type: 'string',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'Login successful',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          success: {
                            type: 'boolean',
                          },
                          token: {
                            type: 'string',
                            description: 'JWT token',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '/.well-known/apple-app-site-association': {
            get: {
              summary: 'Apple App Site Association',
              description: 'Get the Apple App Site Association file',
              responses: {
                '200': {
                  description: 'Apple App Site Association file',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          applinks: {
                            type: 'object',
                            properties: {
                              apps: {
                                type: 'array',
                                items: {
                                  type: 'string',
                                },
                              },
                              details: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                },
                              },
                            },
                          },
                          webcredentials: {
                            type: 'object',
                            properties: {
                              apps: {
                                type: 'array',
                                items: {
                                  type: 'string',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      };

      res.json(apiDocs);
    } catch (error) {
      console.error('Error serving API docs:', error);
      res.status(500).json({ error: 'Error serving API documentation' });
    }
  }
}

module.exports = new DocsController(); 