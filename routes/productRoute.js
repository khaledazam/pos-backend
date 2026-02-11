const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} = require("../controllers/productController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdmin } = require("../middlewares/isAdmin");

// Public (view only)
router.get("/", isVerifiedUser, getProducts);
router.get("/categories", isVerifiedUser, getCategories);
router.get("/:id", isVerifiedUser, getProduct);

// Admin only (add/edit/delete)
router.post("/", isVerifiedUser, isAdmin, addProduct);
router.put("/:id", isVerifiedUser, isAdmin, updateProduct);
router.delete("/:id", isVerifiedUser, isAdmin, deleteProduct);

module.exports = router;