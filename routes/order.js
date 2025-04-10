const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const updateStoreSales = require('../utils/updateStoreSales');

router.post('/', orderController.placeOrder);

router.get('/user/:userId', orderController.getOrdersByUser);

router.delete('/:id', orderController.deleteOrder);

router.get('/store/:storeId', orderController.getOrdersByStore);

router.put('/:id', async (req, res) => {
  const { id } = req.params; 
  const { status, storeId } = req.body; 

  console.log('Received order ID:', id); 
  console.log('Received status:', status);  
  console.log('Received storeId:', storeId); 

  try {
    if (!status || !storeId) {
      return res.status(400).json({ message: 'Status and storeId are required.' });
    }

    await orderController.updateStoreOrderStatus(storeId, status, id);

    if (status === 'delivered') {
      await updateStoreSales(storeId, id); 
    }
    await orderController.updateMainOrderStatus(id);

    res.status(200).json({
      message: `Order status for store ${storeId} updated to '${status}'.`
    });
  } catch (error) {
    console.error('Error updating order status:', error.message);
    res.status(500).json({ message: 'Server Error', error });
  }
});


module.exports = router;

