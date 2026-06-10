const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  restaurantName: { type: String, default: '' },
  address:        { type: String, default: '' },
  gstin:          { type: String, default: '' },
  phone:          { type: String, default: '' },
  sgstRate:       { type: Number, default: 0 },
  cgstRate:       { type: Number, default: 0 },
  currency:       { type: String, default: '₹' },
  thankYouMsg:    { type: String, default: '' },
  darkMode:       { type: Boolean, default: true },
  directPrinting: { type: Boolean, default: false },
  qzTrayEnabled:  { type: Boolean, default: false },
  kitchenPrinterName: { type: String, default: '' },
  barPrinterName: { type: String, default: '' },
  adminEmail:     { type: String, default: '' },
  senderEmail:    { type: String, default: '' },
  senderPassword: { type: String, default: '' },
  inventoryCategories: { type: [String], default: ['Spirits','Beer','Wine','Food','Mixers'] },
  menuCategories:      { type: [String], default: ['Spirits','Beer','Wine','Food','Mixers'] },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
