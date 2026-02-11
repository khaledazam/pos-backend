const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
        },
        unit: {
            type: String,
            default: "pcs",
        },
        category: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        threshold: {
            type: Number,
            default: 5,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
