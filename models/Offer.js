const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  id: { type: String, required: true },
  code: { type: String, required: true },
  valueType: { type: String, enum: ['percent', 'flat'], required: true },
  value: { type: Number, required: true },
  title: { type: String, required: true },
  descr: { type: String, default: '' },
  enabled: { type: Boolean, default: true }
});

const bundleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  descr: { type: String, default: '' },
  img: { type: String, required: true },
  sizes: { type: Map, of: Number, default: {} },
  waistSizes: { type: Map, of: Number, default: {} },
  badge: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
  countdownDate: { type: String, default: '' }
});

const offerSchema = new mongoose.Schema({
  key: { type: String, default: 'global_offers', unique: true },
  vouchers: [voucherSchema],
  bundles: [bundleSchema]
});

module.exports = mongoose.model('Offer', offerSchema);
