const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String, //removed required for testing
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
