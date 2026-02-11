// controllers/menuController.js
const MenuItem = require("../models/menuItemModel");
const createHttpError = require("http-errors");

exports.getMenuItems = async (req, res, next) => {
  try {
    const { category, available } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (available !== undefined) filter.available = available === "true";
    
    const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    next(error);
  }
};

exports.createMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, category, available } = req.body;
    
    if (!name || !price) {
      throw createHttpError(400, "Name and price are required");
    }
    
    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      category,
      available
    });
    
    res.status(201).json({
      success: true,
      data: menuItem,
      message: "Menu item created successfully"
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const menuItem = await MenuItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!menuItem) {
      throw createHttpError(404, "Menu item not found");
    }
    
    res.status(200).json({
      success: true,
      data: menuItem,
      message: "Menu item updated successfully"
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const menuItem = await MenuItem.findByIdAndDelete(id);
    
    if (!menuItem) {
      throw createHttpError(404, "Menu item not found");
    }
    
    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};