const mongoose = require('mongoose');

const billCounterSchema = new mongoose.Schema({
  businessDate: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('BillCounter', billCounterSchema);
