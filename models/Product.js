const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  fabric: { type: String, required: true },
  sizes: { type: Map, of: Number, default: {} },
  waistSizes: { type: Map, of: Number, default: {} },
  description: { type: String, default: '' },
  img: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
