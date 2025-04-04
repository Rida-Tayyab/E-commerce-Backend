const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    businessName: { type: String},
    ownerName: { type: String},
    ownerEmail: { type: String},
    businessType: { type: String},
    NTN: { type: String },
    contactEmail: { type: String },
    phone: { type: String },
    website: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String }
    },
    logoUrl: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Store', storeSchema);
