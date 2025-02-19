const axios = require('axios');
require('dotenv').config();

const initiatePayment = async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        const requestData = {
            merchantId: process.env.ALFLAH_MERCHANT_ID,
            orderId,
            amount,
            currency: 'PKR',
            returnUrl: process.env.ALFLAH_RETURN_URL,
            cancelUrl: process.env.ALFLAH_CANCEL_URL,
            description: 'Payment for order',
        };

        const response = await axios.post(process.env.ALFLAH_API_URL, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ALFLAH_API_KEY}`,
            },
        });

        return res.json({ success: true, paymentUrl: response.data.paymentUrl });
    } catch (error) {
        console.error('Error initiating payment:', error);
        res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { transactionId } = req.body;
        const response = await axios.get(`${process.env.ALFLAH_VERIFY_URL}/${transactionId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.ALFLAH_API_KEY}`,
            },
        });

        return res.json({ success: response.data.success, status: response.data.status });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

module.exports = { initiatePayment, verifyPayment };
