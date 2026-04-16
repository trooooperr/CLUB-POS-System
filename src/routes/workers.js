const express = require('express');
const Worker = require('../models/Worker');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getCache, setCache, deleteCache } = require('../lib/redis');
const router = express.Router();

const WORKERS_CACHE_KEY = 'workers:all';

router.get('/', async (req, res) => {
  try {
    const cached = await getCache(WORKERS_CACHE_KEY);
    if (cached) return res.json(cached);

    const workers = await Worker.find().sort({ name: 1 }).populate('userId', 'isActive role username');
    await setCache(WORKERS_CACHE_KEY, workers, 300);
    res.json(workers);
  }
  catch (err) { res.status(500).json({ message: err.message }); }
});
router.get('/:id/history', async (req, res) => {
  try {
    const history = await Transaction.find({ workerId: req.params.id }).sort({ date: -1 });
    res.json(history);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const workerData = req.body;
    // --- AUTO LOGIN ACCOUNT LOGIC ---
    let userId = null;
    try {
      const username = workerData.name.toLowerCase().replace(/\s+/g, '');
      
      let user = await User.findOne({ 
        $or: [
          { username: username }, 
          { email: (workerData.email && workerData.email.length > 0) ? workerData.email : undefined }
        ]
      });
      
      if (!user) {
        user = new User({
          name: workerData.name,
          username,
          passwordHash: 'staff123',
          role: workerData.role?.toLowerCase().includes('manager') ? 'manager' : 'staff',
          email: (workerData.email && workerData.email.length > 0) ? workerData.email : undefined
        });
        await user.save();
      } else {
        // Sync email if provided
        if (workerData.email && (!user.email || user.email === '')) {
          user.email = workerData.email;
          await user.save();
        }
      }
      userId = user._id;
    } catch (e) {
      console.error('Auto-account creation failed:', e.message);
    }

    const worker = new Worker({ ...workerData, userId });
    const savedWorker = await worker.save();

    if (parseFloat(workerData.paidSalary) > 0) {
      await new Transaction({
        workerId: savedWorker._id,
        workerName: savedWorker.name,
        amount: parseFloat(req.body.paidSalary),
        type: 'Payment'
      }).save();
    }
    await deleteCache(WORKERS_CACHE_KEY);
    res.status(201).json(savedWorker);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
router.put('/:id', async (req, res) => {
  try {
    const oldWorker = await Worker.findById(req.params.id);
    if (!oldWorker) return res.status(404).json({ message: 'Worker not found' });
    const newTotalPaid = parseFloat(req.body.paidSalary) || 0;
    const addedAmount = newTotalPaid - oldWorker.paidSalary;

    const updated = await Worker.findByIdAndUpdate(req.params.id, req.body, { 
      new: true, 
      runValidators: true 
    });

    if (addedAmount > 0) {
      await new Transaction({
        workerId: updated._id,
        workerName: updated.name,
        amount: addedAmount,
        type: 'Payment'
      }).save();
    }

    // --- SYNC WITH USER ACCOUNT ---
    try {
      if (updated.userId) {
        const user = await User.findById(updated.userId);
        if (user) {
          if (req.body.name) user.name = req.body.name;
          if (req.body.email) user.email = req.body.email;
          else if (req.body.email === '') user.email = undefined; // Support clearing email
          if (req.body.role) {
            user.role = req.body.role.toLowerCase().includes('manager') ? 'manager' : 'staff';
          }
          await user.save();
        }
      } else if (req.body.role) {
        // AUTO-ACTIVATION for roles that need login
        const username = updated.name.toLowerCase().replace(/\s+/g, '');
        const newUser = new User({
          name: updated.name,
          username,
          passwordHash: 'staff123',
          role: req.body.role.toLowerCase().includes('manager') ? 'manager' : 'staff',
          email: (updated.email && updated.email.length > 0) ? updated.email : undefined
        });
        await newUser.save();
        updated.userId = newUser._id;
        await updated.save();
      }
    } catch (e) {
      console.error('User sync failed:', e.message);
    }

    await deleteCache(WORKERS_CACHE_KEY);
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    
    // Cleanup transactions
    await Transaction.deleteMany({ workerId: req.params.id });
    
    // Optionally keep the User account but disable it? 
    // For now, we'll just unlink it from the worker record if we want to delete perfectly.
    // Or just delete the worker record and leave the user document alone.
    await Worker.findByIdAndDelete(req.params.id);

    await deleteCache(WORKERS_CACHE_KEY);
    res.json({ success: true, id: req.params.id }); 
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
