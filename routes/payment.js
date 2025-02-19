const express = require('express');
const { initiatePayment, verifyPayment } = require('../controllers/paymentController');

const router = express.Router();

// Payment route to initiate payment
router.post('/payment/initiate', initiatePayment);

// Payment route to verify payment callback
router.post('/payment/return', verifyPayment);

module.exports = router;
