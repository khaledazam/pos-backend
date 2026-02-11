const express = require("express");
const router = express.Router();
const {
    getAllPlayStations,
    createPlayStation,
    updatePlayStation,
    startSession,
    endSession,
    deletePlayStation,
    getInvoice
} = require("../controllers/playStationController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdmin } = require("../middlewares/isAdmin");

// PlayStation CRUD (Admin Only)
router.get("/", getAllPlayStations); // All users can see devices
router.post("/", isVerifiedUser, isAdmin, createPlayStation);
router.put("/:id", isVerifiedUser, isAdmin, updatePlayStation);
router.delete("/:id", isVerifiedUser, isAdmin, deletePlayStation);

// Session Management (Admin & Cashier Allowed)
router.post("/sessions/start", isVerifiedUser, startSession);
router.post("/sessions/end/:sessionId", isVerifiedUser, endSession);
router.get("/invoices/:sessionId", isVerifiedUser, getInvoice);

module.exports = router;
