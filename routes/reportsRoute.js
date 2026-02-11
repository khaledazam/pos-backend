const express = require("express");
const router = express.Router();
const Order = require("../models/orderModel");
const Inventory = require("../models/inventoryModel");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdmin } = require("../middlewares/isAdmin");

router.get("/summary", isVerifiedUser, isAdmin, async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const orders = await Order.find({
            createdAt: { $gte: today }
        });

        const todaySales = orders.reduce((sum, order) => sum + (order.bills?.totalWithTax || 0), 0);
        const totalInvoices = orders.length;

        const lowStockProducts = await Inventory.find({
            $expr: { $lte: ["$quantity", "$threshold"] }
        });

        res.status(200).json({
            success: true,
            data: {
                todaySales,
                totalInvoices,
                lowStockProducts: lowStockProducts.length,
                lowStockDetails: lowStockProducts
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
