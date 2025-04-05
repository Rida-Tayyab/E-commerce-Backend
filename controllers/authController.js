const User = require('../models/User');
const Store = require('../models/Store');
const bcrypt = require('bcrypt');

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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
      businessType,
      NTN,
      contactEmail,
      phone,
      website,
      address,
      logoUrl,
      description,
      password
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
      businessType,
      NTN,
      contactEmail,
      phone,
      website,
      address,
      logoUrl,
      description,
      password: hashedPassword,
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
    console.log(user.isAdmin);
    // Redirect user based on isAdmin status
    if (user.isAdmin) {
      return res.status(200).json({ user });
    } else {
      return res.status(200).json({ user });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { registerUser, registerStore, loginUser };
