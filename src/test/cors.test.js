const request = require('supertest');
const app = require('../../app');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;
let originalNodeEnv;
let originalAllowedOrigins;

beforeAll(async () => {
  // Save environment variables
  originalNodeEnv = process.env.NODE_ENV;
  originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

  // Set NODE_ENV to production for testing production CORS checks
  process.env.NODE_ENV = 'production';
  process.env.ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:3001';

  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  // Restore environment variables
  process.env.NODE_ENV = originalNodeEnv;
  process.env.ALLOWED_ORIGINS = originalAllowedOrigins;

  await mongoose.connection.close();
  await mongo.stop();
});

describe('CORS Policy Verification', () => {
  it('should allow requests with no Origin header', async () => {
    const res = await request(app)
      .get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should allow requests from allowed origins (in ALLOWED_ORIGINS list)', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3001');

    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3001');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should allow same-origin requests (where Origin matches Host)', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://humtum-restaurant.com')
      .set('Host', 'humtum-restaurant.com');

    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://humtum-restaurant.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should block and return 403 for disallowed cross-origin requests in production', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://attacker-site.com')
      .set('Host', 'humtum-restaurant.com');

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('not allowed by CORS');
  });
});
