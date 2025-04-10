const mongoose = require("mongoose");

const cartHistorySchema = new mongoose.Schema({
  orderId:{
    type:Number,
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
  ],
  totalAmount: {
    type: Number,
    default: 0,
  },
});

const CartHistory = mongoose.model("CartHistory", cartHistorySchema);

module.exports = CartHistory;
