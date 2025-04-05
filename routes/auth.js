const express = require('express');
const { registerUser, loginUser, registerStore } = require('../controllers/authController');
const router = express.Router();

router.post('/registerUser', registerUser);
router.post('/login', loginUser);
router.post('/register-store', registerStore);

module.exports = router;
