const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Store = require('../models/Store');


// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password,shippingAddress } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      shippingAddress: {
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Register Store
const registerStore = async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      ownerEmail,
      password,
      businessType,
      NTN,
      contactEmail,
      phone,
      website,
      address,
      logoUrl,
      description,
    } = req.body;

    // Check if store exists
    const storeExists = await Store.findOne({ ownerEmail });
    if (storeExists) return res.status(400).json({ message: 'Store already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const store = new Store({
      businessName,
      ownerName,
      ownerEmail,
      password: hashedPassword,
      businessType,
      NTN,
      contactEmail,
      phone,
      website,
      address,
      logoUrl,
      description,
    });

    await store.save();
    res.status(201).json({ message: 'Store registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect)
      return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false, 
      sameSite: 'Lax',
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        shippingAddress: user.shippingAddress,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login Store
const loginStore = async (req, res) => {
  try {
    const { ownerEmail, password } = req.body;
    console.log('Login Store:', req.body);
    const store = await Store.findOne({ ownerEmail });
    if (!store) return res.status(404).json({ message: 'Store not found' });

    const isPasswordCorrect = await bcrypt.compare(password, store.password);
    console.log('Password Check:', isPasswordCorrect);
    if (!isPasswordCorrect)
      return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: store._id, ownerEmail: store.ownerEmail },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false, 
      sameSite: 'Lax',
    });

    res.status(200).json({
      message: 'Login successful',
      store: {
        _id: store._id,
        businessName: store.businessName,
        ownerName: store.ownerName,
        ownerEmail: store.ownerEmail,
        businessType: store.businessType,
        logoUrl: store.logoUrl,
        NTN: store.NTN,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { registerUser, registerStore, loginUser, loginStore };
