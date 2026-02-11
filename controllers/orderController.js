const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const { default: mongoose } = require("mongoose");

const PlayStationSession = require("../models/playStationSessionModel");
const Table = require("../models/tableModel");
const Payment = require("../models/paymentModel");
const Inventory = require("../models/inventoryModel");
const Product = require("../models/productModel");

// ================== Add Order ==================
const addOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tableId, items, customerDetails, paymentMethod } = req.body;

    // ✅ Validation: Items
    if (!items || items.length === 0) {
      throw createHttpError(400, "يجب أن يحتوي الطلب على منتج واحد على الأقل.");
    }

    // ✅ Validation: Table (اختياري)
    let table = null;
    if (tableId) {
      table = await Table.findById(tableId).session(session);
      if (!table) throw createHttpError(404, "الطاولة غير موجودة.");
      if (table.status === "Occupied" && table.currentOrder) {
        throw createHttpError(400, "الطاولة مشغولة بطلب آخر.");
      }
    }

    // ✅ حساب الإجمالي + التحقق من المنتجات + خصم الكمية
    let total = 0;
    const validatedItems = [];

    for (const orderItem of items) {
      const { item: productId, quantity, unitPrice } = orderItem;

      if (!productId || !quantity || !unitPrice) {
        throw createHttpError(400, "كل منتج يجب أن يحتوي على item ID، quantity، و unitPrice.");
      }

      // ← التعديل الرئيسي: استخدم Product بدل Inventory
      const product = await Product.findById(productId)
        .select("name price unit quantity")
        .session(session);

      if (!product) {
        throw createHttpError(404, `المنتج ${productId} غير موجود في المخزون`);
      }

      // ✅ التحقق من توفر الكمية في المخزون
      if (product.quantity < quantity) {
        throw createHttpError(
          400,
          `الكمية المتاحة من "${product.name}" غير كافية. متاح: ${product.quantity}، مطلوب: ${quantity}`
        );
      }

      // ✅ خصم الكمية من المخزون
      product.quantity -= quantity;
      await product.save({ session });

      const itemTotal = quantity * unitPrice;
      total += itemTotal;

      validatedItems.push({
        item: productId,
        name: product.name,
        quantity,
        unitPrice,
      });
    }

    const taxRate = 0;
    const tax = total * taxRate;
    const totalWithTax = total + tax;

    // ✅ إنشاء الطلب بحالة Paid مباشرة
    const newOrder = new Order({
      table: tableId || null,
      items: validatedItems,
      bills: { total, tax, totalWithTax },
      orderStatus: "Paid",
      customerDetails: customerDetails || { name: "زبون", phone: "", guests: 1 },
      paymentMethod: paymentMethod || "كاش",
      cashier: req.user?._id,
      orderDate: new Date(),
      paidAt: new Date(),
    });

    await newOrder.save({ session });

    // ✅ إنشاء الـ Payment في collection منفصل
    const orderCode = `INV-${newOrder._id.toString().slice(-6).toUpperCase()}`;

    const payment = new Payment({
      orderCode,
      order: newOrder._id,
      sessionId: null,

      table: table ? {
        _id: table._id,
        tableNo: table.tableNo,
        name: table.name,
        capacity: table.capacity || table.seats
      } : null,

      items: validatedItems.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.quantity * i.unitPrice
      })),

      bills: {
        subtotal: total,
        tax: tax,
        total: totalWithTax
      },

      customerDetails: {
        name: customerDetails?.name || "زبون",
        phone: customerDetails?.phone || "",
        guests: customerDetails?.guests || 1
      },

      paymentMethod: paymentMethod || "كاش",
      cashier: req.user?._id,
      status: "Paid",
      paidAt: new Date()
    });

    await payment.save({ session });

    // ✅ تحرير الطاولة (لأن الطلب مدفوع)
    if (tableId && table) {
      table.status = "Available";
      table.currentOrder = null;
      await table.save({ session });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "تم إنشاء الطلب وتحديث المخزون بنجاح",
      data: {
        order: newOrder,
        payment: payment
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Error in addOrder:", error);
    next(error);
  } finally {
    session.endSession();
  }
};


// ================== Get Order By Id ==================
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid order ID!");
    }

    const order = await Order.findById(id)
      .populate("table")
      .populate("items.item")
      .populate("cashier", "name email");

    if (!order) {
      throw createHttpError(404, "Order not found!");
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// ================== Get All Orders ==================
const getOrders = async (req, res, next) => {
  try {
    const {
      status,
      tableId,
      paymentMethod,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // ✅ Build filter
    const filter = {};

    if (status) filter.orderStatus = status;
    if (tableId && mongoose.Types.ObjectId.isValid(tableId)) {
      filter.table = tableId;
    }
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    // ✅ Pagination
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("table")
        .populate("items.item", "name price")
        .populate("cashier", "name email")
        .sort({ orderDate: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Order.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// ================== Update Order Status ==================
const updateOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderStatus } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid order ID");
    }

    // ✅ Validate status
    const validStatuses = ["Pending", "In Progress", "Ready", "Completed", "Cancelled"];
    if (!validStatuses.includes(orderStatus)) {
      throw createHttpError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const order = await Order.findById(id).populate("table").session(session);
    if (!order) {
      throw createHttpError(404, "Order not found");
    }

    // ✅ Update order status
    order.orderStatus = orderStatus;
    await order.save({ session });

    // ✅ إذا تم إلغاء الأوردر أو إكماله، حرر الطاولة
    if ((orderStatus === "Cancelled" || orderStatus === "Completed" || orderStatus === "Ready" || orderStatus === "In Progress" || orderStatus === "Pending") && order.table) {
      await Table.findByIdAndUpdate(
        order.table._id,
        {
          status: "Available",
          currentOrder: null
        },
        { session }
      );

      console.log(`✅ Table ${order.table.tableNo} freed (Order ${orderStatus})`);
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Order ${orderStatus.toLowerCase()} successfully${orderStatus === "Completed" ? ". Table is now available." : ""}`,
      data: order
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ================== Delete Order ==================
const deleteOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid order ID");
    }

    const order = await Order.findById(id).populate("table").session(session);
    if (!order) {
      throw createHttpError(404, "Order not found");
    }

    // ✅ تحرير الطاولة
    if (order.table) {
      await Table.findByIdAndUpdate(
        order.table._id,
        {
          status: "Available",
          currentOrder: null
        },
        { session }
      );
    }

    // ✅ حذف الأوردر
    await Order.findByIdAndDelete(id, { session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ================== Get Order Statistics ==================
const getOrderStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.orderDate = {};
      if (startDate) matchStage.orderDate.$gte = new Date(startDate);
      if (endDate) matchStage.orderDate.$lte = new Date(endDate);
    }

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$bills.totalWithTax" },
          avgOrderValue: { $avg: "$bills.totalWithTax" },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Pending"] }, 1, 0] }
          },
          inProgressOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "In Progress"] }, 1, 0] }
          },
          readyOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Ready"] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Completed"] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        pendingOrders: 0,
        inProgressOrders: 0,
        readyOrders: 0,
        completedOrders: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// ================== Add To Payment ==================

module.exports = {
  addOrder,
  getOrderById,
  getOrders,
  updateOrder,
  deleteOrder,
  getOrderStats
};