const express = require("express");
const { register, login, getUserData, logout } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// ✅ Public Routes
router.post("/register", register);
router.post("/login", login);

// ✅ Protected Routes (require authentication)
router.post("/logout", isVerifiedUser, logout);
// router.get("/me", isVerifiedUser, getUserData);

module.exports = router;