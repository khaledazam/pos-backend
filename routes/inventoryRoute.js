const express = require("express");
const router = express.Router();
const {
    addInventoryItem,
    getAllInventory,
    updateInventoryItem,
    deleteInventoryItem,
} = require("../controllers/inventoryController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdmin } = require("../middlewares/isAdmin");

router.post("/", isVerifiedUser, isAdmin, addInventoryItem);
router.get("/", isVerifiedUser, getAllInventory);
router.get("/categories", isVerifiedUser, (req, res, next) => {
    // Basic inline categories extraction since we map this to inventoryRoute
    const { getCategories } = require("../controllers/inventoryController");
    getCategories(req, res, next);
});
router.put("/:id", isVerifiedUser, isAdmin, updateInventoryItem);
router.delete("/:id", isVerifiedUser, isAdmin, deleteInventoryItem);

module.exports = router;
