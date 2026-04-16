const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  workerName: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Payment', 'Reset'], default: 'Payment' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);