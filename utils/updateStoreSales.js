const mongoose = require('mongoose');
const Order = require('../models/Order');
const Store = require('../models/Store');

const updateStoreSales = async (storeId) => {
  const salesData = await Order.aggregate([
    { $match: { status: "delivered" } },
    {
      $lookup: {
        from: "carts",
        localField: "cart",
        foreignField: "_id",
        as: "cart"
      }
    },
    { $unwind: "$cart" },
    { $unwind: "$cart.products" },
    {
      $lookup: {
        from: "products",
        localField: "cart.products.product",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" },
    { $match: { "productDetails.store": new mongoose.Types.ObjectId(storeId) } },
    {
      $group: { _id: "$_id" }
    },
    {
      $count: "totalSales"
    }
  ]);

  const totalSales = salesData[0]?.totalSales || 0;
  await Store.findByIdAndUpdate(storeId, { totalSales });
};

module.exports = updateStoreSales;
