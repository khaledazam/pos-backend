const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    customerDetails: {
        name: { type: String, required: true },
        phone: { type: String, required: true },  // صححت requried → required
        guests: { type: Number, required: true },
    },
    orderStatus: {
        type: String,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    bills: {
        total: { type: Number, required: true },
        tax: { type: Number, required: false },
        totalWithTax: { type: Number, required: true }
    },

    // ────────────────────────────────────────────────
    // التعديل المهم هنا
    items: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory"   // ← غيّر "Inventory" لاسم الموديل الحقيقي بتاع المنتجات
        },
        name: { type: String },          // اختياري: لو عايز تحفظ الاسم كمان
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true }
    }],

    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "PlayStationSession" },
    paymentMethod: String,
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paymentData: {
        razorpay_order_id: String,
        razorpay_payment_id: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);