const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  img: { type: String, required: true },
  typo: { type: String, required: true },
  bg: { type: String, required: true },
  label: { type: String, required: true },
  desc: { type: String, default: '' },
  orderIndex: { type: Number, default: 0 }
});

module.exports = mongoose.model('Gallery', gallerySchema);
