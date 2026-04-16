const request = require('supertest');
const app = require('../../app');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { generateToken } = require('../middleware/auth');

let mongo;

describe('Orders API', () => {
  let token;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    
    const user = await User.create({
      name: 'Admin',
      username: 'admin',
      passwordHash: 'admin123',
      role: 'admin'
    });
    token = generateToken(user);
    
    await Inventory.create({
      name: 'Test Soda',
      category: 'General',
      unit: 'Bottles',
      stock: 10,
      minStock: 2,
      price: 50
    });
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
  });

  it('should create an order and reduce inventory', async () => {
    const orderData = {
      billNo: '9999',
      tableNo: 1,
      items: [{ name: 'Test Soda', quantity: 2, price: 50 }],
      subtotal: 100,
      sgst: 2.5,
      cgst: 2.5,
      discount: 0,
      grandTotal: 105,
      paidAmount: 105,
      dueAmount: 0,
      paymentMode: 'cash',
      date: new Date().toISOString()
    };

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(orderData);
    
    expect(res.statusCode).toBe(201);
    const item = await Inventory.findOne({ name: 'Test Soda' });
    expect(item.stock).toBe(8);
  });
});
