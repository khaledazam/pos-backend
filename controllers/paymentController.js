// controllers/paymentController.js
const createHttpError = require("http-errors");
const Payment = require("../models/paymentModel");

// ✅ جلب كل الـ Payments
const getPayments = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      status,
      paymentMethod,
      startDate,
      endDate,
      search
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    if (startDate || endDate) {
      filter.paidAt = {};
      if (startDate) filter.paidAt.$gte = new Date(startDate);
      if (endDate) filter.paidAt.$lte = new Date(endDate);
    }
    
    if (search) {
      filter.$or = [
        { orderCode: { $regex: search, $options: "i" } },
        { "customerDetails.name": { $regex: search, $options: "i" } },
        { "customerDetails.phone": { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("cashier", "name email") // ✔ مسموح
        .sort({ paidAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Payment.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// ✅ جلب Payment واحد
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("cashier", "name email");

    if (!payment) {
      throw createHttpError(404, "Payment not found");
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// ✅ إحصائيات الدفع
const getPaymentStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { status: "Paid" };
    
    if (startDate || endDate) {
      matchStage.paidAt = {};
      if (startDate) matchStage.paidAt.$gte = new Date(startDate);
      if (endDate) matchStage.paidAt.$lte = new Date(endDate);
    }

    const stats = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$bills.total" },
          totalTax: { $sum: "$bills.tax" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$bills.total" },
          cashPayments: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "$bills.total", 0] }
          },
          cardPayments: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "Card"] }, "$bills.total", 0] }
          },
          walletPayments: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "Wallet"] }, "$bills.total", 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalRevenue: 0,
        totalTax: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        cashPayments: 0,
        cardPayments: 0,
        walletPayments: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// ✅ تحديث حالة الدفع
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!["Paid", "Refunded", "Cancelled"].includes(status)) {
      throw createHttpError(400, "Invalid status");
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!payment) {
      throw createHttpError(404, "Payment not found");
    }

    res.status(200).json({
      success: true,
      message: "Payment status updated",
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  getPaymentStats,
  updatePaymentStatus
};
