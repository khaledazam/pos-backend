const express = require("express");
const {
  addTable,
  getTables,
  updateTable,
  deleteTable
} = require("../controllers/tableController");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdmin } = require("../middlewares/isAdmin");

// ✅ Table Routes
router.post("/", isVerifiedUser, isAdmin, addTable);        // POST /api/table
router.get("/", isVerifiedUser, getTables);                 // GET /api/table
router.put("/:id", isVerifiedUser, updateTable);   // PUT /api/table/:id
router.delete("/:id", isVerifiedUser, isAdmin, deleteTable); // DELETE /api/table/:id

module.exports = router;