const mongoose = require('mongoose');

const whatsappSessionSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

// unique: true on the key field already creates an index, no manual index needed

module.exports = mongoose.model('WhatsAppSession', whatsappSessionSchema);
