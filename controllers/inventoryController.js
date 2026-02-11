const Inventory = require("../models/inventoryModel");

// Create new inventory item
exports.addInventoryItem = async (req, res, next) => {
    try {
        const { name, quantity, unit, price, category, threshold } = req.body;

        const newItem = await Inventory.create({
            name,
            quantity,
            unit,
            price,
            category,
            threshold,
        });

        res.status(201).json({
            success: true,
            data: newItem,
            message: "Item added successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Get all inventory items with low-stock warning
exports.getAllInventory = async (req, res, next) => {
    try {
        const items = await Inventory.find().sort({ createdAt: -1 });

        const itemsWithWarning = items.map((item) => {
            const itemObj = item.toObject();
            return {
                ...itemObj,
                warning: item.quantity <= item.threshold,
            };
        });

        res.status(200).json({
            success: true,
            data: itemsWithWarning,
        });
    } catch (error) {
        next(error);
    }
};

// Update inventory item quantity
exports.updateInventoryItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity, name, unit, price, category, threshold } = req.body;

        const item = await Inventory.findById(id);

        if (!item) {
            const error = new Error("Item not found");
            error.statusCode = 404;
            throw error;
        }

        // Update fields if provided
        if (quantity !== undefined) item.quantity = quantity;
        if (name) item.name = name;
        if (unit) item.unit = unit;
        if (price !== undefined) item.price = price;
        if (category) item.category = category;
        if (threshold !== undefined) item.threshold = threshold;

        await item.save();

        res.status(200).json({
            success: true,
            data: item,
            message: "Item updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        const item = await Inventory.findByIdAndDelete(id);

        if (!item) {
            const error = new Error("Item not found");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: "Item deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Inventory.distinct("category");
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};
