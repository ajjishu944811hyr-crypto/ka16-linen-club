const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  colorName: { type: String, required: true },
  colorHex: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, required: true },
  sizes: { type: Map, of: Number, default: {} },
  waistSizes: { type: Map, of: Number, default: {} }
});

const newArrivalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  fabric: { type: String, required: true },
  description: { type: String, default: '' },
  tag: { type: String, default: '' },
  published: { type: Boolean, default: true },
  variants: [variantSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NewArrival', newArrivalSchema);
