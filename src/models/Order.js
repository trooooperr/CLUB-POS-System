const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  billNo:        { type: String, required: true, index: true },
  date:          { type: Date, default: Date.now, index: true },
  grandTotal:    { type: Number, required: true },
  paidAmount:    { type: Number, default: 0 },
  dueAmount:     { type: Number, default: 0, index: true },
  paymentMode:   { type: String, required: true },
  tableNo:       { type: Number, required: true },
  items:         [{ name: String, quantity: Number, price: Number }],
  subtotal:      { type: Number, required: true },
  sgst:          { type: Number, required: true },
  cgst:          { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  roundOff:      { type: Number, default: 0 },
  customerPhone: { type: String, default: '' },
  customerName:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
