const express = require("express");
const {
  addOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder
} = require("../controllers/orderController");

const router = express.Router();


// ================== Orders ==================
router.post("/", addOrder);
router.get("/", getOrders);
router.put("/:id", updateOrder);
router.get("/:id", getOrderById);
router.delete("/:id", deleteOrder);


module.exports = router;
