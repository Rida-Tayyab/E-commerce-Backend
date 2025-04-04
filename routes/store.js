const express = require("express");
const router = express.Router();
const Store = require("../models/Store"); 

router.post("/register-store", async (req, res) => {
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
      description
    } = req.body;

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
    });
    await store.save();
    res.status(201).json({ message: "Store registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;