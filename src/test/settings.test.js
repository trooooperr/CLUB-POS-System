const request = require('supertest');
const app = require('../../app');
const User = require('../models/User');
const Settings = require('../models/Settings');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { generateToken } = require('../middleware/auth');

let mongo;

describe('Settings API', () => {
  let token;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    
    // Seed settings
    await Settings.create({
      restaurantName: 'HumTum POS',
      currency: '₹'
    });

    const user = await User.create({
      name: 'Admin',
      username: 'admin',
      passwordHash: 'admin123',
      role: 'admin'
    });
    token = generateToken(user);
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
  });

  it('should fetch business settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.restaurantName).toBe('HumTum POS');
  });

  it('should update business settings', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        restaurantName: 'HumTum Updated',
        sgstRate: 3.5
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.restaurantName).toBe('HumTum Updated');
    expect(res.body.sgstRate).toBe(3.5);
  });
});
