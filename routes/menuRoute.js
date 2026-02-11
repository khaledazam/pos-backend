// routes/menuRoute.js
const express = require("express");
const router = express.Router();
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require("../controllers/menuController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdmin } = require("../middlewares/isAdmin");

router.get("/", getMenuItems);
router.post("/", isAdmin, createMenuItem);
router.put("/:id", isAdmin, updateMenuItem);
router.delete("/:id", isAdmin, deleteMenuItem);

module.exports = router;