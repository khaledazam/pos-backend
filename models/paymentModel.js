// models/paymentModel.js - تحديث
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderCode: { type: String, required: true, unique: true }, // ✅ إضافة هذا الحقل
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "PlayStationSession", default: null },
  
  table: { 
    type: mongoose.Schema.Types.Mixed, 
    default: null 
  },
  
  items: [
    {
      name: String,
      quantity: Number,
      unitPrice: Number,
      total: Number
    }
  ],
  
  bills: {
    subtotal: Number,
    tax: { type: Number, default: 0 },
    total: Number
  },
  
  customerDetails: {
    name: { type: String, default: "Guest" },
    phone: { type: String, default: "" },
    guests: { type: Number, default: 1 }
  },
  
  paymentMethod: { type: String, default: "Cash" },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "Paid" },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);