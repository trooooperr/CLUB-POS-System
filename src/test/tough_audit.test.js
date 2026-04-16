const request = require('supertest');
const app = require('../../app');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { generateToken } = require('../middleware/auth');

let mongo;

describe('HumTum POS - Strict Sector Audit', () => {
  let adminToken, managerToken, staffToken;
  let admin, manager, staff;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    
    // Setup Users
    admin = await User.create({ name: 'Super Admin', username: 'admin', passwordHash: 'pw', role: 'admin' });
    manager = await User.create({ name: 'Day Manager', username: 'manager', passwordHash: 'pw', role: 'manager' });
    staff = await User.create({ name: 'Waiter One', username: 'staff', passwordHash: 'pw', role: 'staff' });
    
    adminToken = generateToken(admin);
    managerToken = generateToken(manager);
    staffToken = generateToken(staff);

    // Setup Inventory
    await Inventory.create({ name: 'Kingfisher Ultra', category: 'Drinks', unit: 'Bottles', stock: 50, minStock: 5, price: 200 });
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
  });

  describe('Sector 1: Security & RBAC Strictness', () => {
    it('STRICT: Manager should be BLOCKED from resetting Admin password', async () => {
      const res = await request(app)
        .patch(`/api/auth/reset-worker-password/${admin._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ newPassword: 'hack-password-123' });
      
      expect(res.statusCode).toBe(403); // Forbidden
    });

    it('STRICT: Manager SHOULD be able to reset Staff password', async () => {
      const res = await request(app)
        .patch(`/api/auth/reset-worker-password/${staff._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ newPassword: 'safe-password-123' });
      
      expect(res.statusCode).toBe(200);
    });

    it('STRICT: Inactive accounts should be BLOCKED from login', async () => {
      staff.isActive = false;
      await staff.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'staff', password: 'pw' });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/Account disabled/i);
    });
  });

  describe('Sector 2 & 3: Financials & Inventory Accuracy', () => {
    it('TOUGH: Should handle Partial Settlement correctly', async () => {
      const orderData = {
        billNo: 'AUDIT-001',
        tableNo: 5,
        items: [{ name: 'Kingfisher Ultra', quantity: 10, price: 200 }],
        subtotal: 2000,
        sgst: 50,
        cgst: 50,
        discount: 0,
        grandTotal: 2100,
        paidAmount: 500, // Only part paid
        dueAmount: 1600,
        paymentMode: 'cash',
        date: new Date().toISOString()
      };

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(orderData);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.dueAmount).toBe(1600);

      // Check Inventory Reduction
      const item = await Inventory.findOne({ name: 'Kingfisher Ultra' });
      expect(item.stock).toBe(40); // 50 - 10
    });

    it('TOUGH: Should clear remaining dues in History', async () => {
      const activeOrder = (await request(app).get('/api/orders').set('Authorization', `Bearer ${adminToken}`)).body[0];
      
      const res = await request(app)
        .patch(`/api/orders/${activeOrder._id}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paidAmount: 1600, paymentMode: 'upi' });

      expect(res.statusCode).toBe(200);
      expect(res.body.dueAmount).toBe(0);
      expect(res.body.paidAmount).toBe(2100);
    });
  });
});
