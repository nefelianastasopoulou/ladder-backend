/**
 * API Documentation Endpoint
 * Provides basic API documentation without external dependencies
 */

const apiDocumentation = {
  openapi: "3.0.0",
  info: {
    title: "Ladder Backend API",
    version: "1.0.0",
    description: "Backend API for the Ladder application - a platform for youth opportunities and community building"
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://ladder-backend-production.up.railway.app'
        : 'http://localhost:3001',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health Check",
        description: "Basic health check endpoint",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string" },
                        message: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/signup": {
      post: {
        summary: "User Registration",
        description: "Register a new user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "username", "full_name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  username: { type: "string", minLength: 3, maxLength: 20 },
                  full_name: { type: "string", minLength: 2, maxLength: 100 }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        user: { type: "object" },
                        token: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Validation error or user already exists"
          }
        }
      }
    },
    "/api/auth/signin": {
      post: {
        summary: "User Login",
        description: "Authenticate user and return JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: {
                  email: { type: "string", format: "email" },
                  username: { type: "string" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        user: { type: "object" },
                        token: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Invalid credentials"
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

module.exports = apiDocumentation;
