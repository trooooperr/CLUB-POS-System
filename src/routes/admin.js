const express = require('express');
const router = express.Router();
const { deleteCache } = require('../lib/redis');

// CLEAR CACHE ENDPOINT
router.post('/clear-cache', async (req, res) => {
  try {
    await deleteCache(['menu:all', 'inventory:all', 'workers:all', 'settings:current', 'orders:all']);
    res.json({ success: true, message: 'All caches cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
