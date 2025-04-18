const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');
const customerRoutes = require('./routes/customer');
const paymentRoutes = require('./routes/payment');
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const cookieParser = require('cookie-parser');
const productRoutes = require('./routes/product');
const reviewRoutes = require('./routes/review');
const analyticsRoutes = require('./routes/analytics');


dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true,
}));
app.use('/api/auth', authRoutes);
app.use('/store', storeRoutes);
app.use('/customer', customerRoutes);
app.use("/cart", cartRoutes);
app.use("/order", orderRoutes);
app.use('/product', productRoutes);
app.use('/reviews', reviewRoutes);
app.use('/analytics', analyticsRoutes);
app.use(paymentRoutes);


// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
