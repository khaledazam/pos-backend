const express = require("express");
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  getPaymentStats,
  updatePaymentStatus
} = require("../controllers/paymentController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdmin } = require("../middlewares/isAdmin");

// ✅ Payment Routes (منفصلة تماماً عن Orders)
router.get("/", getPayments);           // GET /api/payments
router.get("/stats", getPaymentStats);  // GET /api/payments/stats
router.get("/:id", getPaymentById);     // GET /api/payments/:id
router.put("/:id", isAdmin, updatePaymentStatus); // PUT /api/payments/:id

module.exports = router;