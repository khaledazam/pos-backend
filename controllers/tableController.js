const Table = require("../models/tableModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose");

// ✅ Add Table
const addTable = async (req, res, next) => {
  try {
    const { tableNo, seats } = req.body;

    if (!tableNo) {
      throw createHttpError(400, "Please provide table No!");
    }

    if (!seats || seats <= 0) {
      throw createHttpError(400, "Please provide valid number of seats!");
    }

    const isTablePresent = await Table.findOne({ tableNo });

    if (isTablePresent) {
      throw createHttpError(400, "Table already exists!");
    }

    const newTable = new Table({ 
      tableNo, 
      seats,
      status: "Available",
      currentOrder: null
    });

    await newTable.save();

    res.status(201).json({ 
      success: true, 
      message: "Table added successfully!", 
      data: newTable 
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All Tables
const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find().populate({
      path: "currentOrder",
      select: "customerDetails items bills"
    });

    res.status(200).json({ 
      success: true, 
      data: tables 
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Update Table
const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tableNo, seats, status, orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid table ID!");
    }

    const table = await Table.findById(id);
    if (!table) {
      throw createHttpError(404, "Table not found!");
    }

    // ✅ Build update object
    const updateData = {};
    if (tableNo !== undefined) updateData.tableNo = tableNo;
    if (seats !== undefined) {
      if (seats <= 0) {
        throw createHttpError(400, "Seats must be greater than 0!");
      }
      updateData.seats = seats;
    }
    if (status !== undefined) updateData.status = status;
    if (orderId !== undefined) updateData.currentOrder = orderId;

    const updatedTable = await Table.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Table updated successfully!",
      data: updatedTable
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Delete Table
const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid table ID!");
    }

    const table = await Table.findById(id);
    if (!table) {
      throw createHttpError(404, "Table not found!");
    }

    // ✅ Check if table is occupied
    if (table.status === "Occupied") {
      throw createHttpError(400, "Cannot delete an occupied table. Please complete the order first.");
    }

    await Table.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Table deleted successfully!"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  addTable, 
  getTables, 
  updateTable,
  deleteTable 
};