const request = require('supertest');
const app = require('../../app');

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

describe('Health API', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});
