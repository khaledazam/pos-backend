// models/menuItemModel.js
const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String }, // مثل: "Drinks", "Food", "Desserts"
  available: { type: Boolean, default: true },
  image: { type: String } // اختياري
}, { timestamps: true });

module.exports = mongoose.model("MenuItem", menuItemSchema);