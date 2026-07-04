const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  phone: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
