const express = require('express');
const { registerUser, loginUser, registerStore, loginStore } = require('../controllers/authController');
const router = express.Router();

router.post('/registerUser', registerUser);
router.post('/login', loginUser);
router.post('/register-store', registerStore);
router.post('/login-store', loginStore);

module.exports = router;
