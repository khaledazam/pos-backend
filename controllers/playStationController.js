const createHttpError = require("http-errors");
const { default: mongoose } = require("mongoose");
const PlayStation = require("../models/playStationModel");
const PlayStationSession = require("../models/playStationSessionModel");
const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");

// ================== PlayStation CRUD ==================

// Get All PlayStations
exports.getAllPlayStations = async (req, res, next) => {
    try {
        const playStations = await PlayStation.find().populate("currentSessionId");
        res.status(200).json({
            success: true,
            data: playStations,
        });
    } catch (error) {
        next(error);
    }
};

// Create PlayStation
exports.createPlayStation = async (req, res, next) => {
    try {
        const { name, type, pricePerHour } = req.body;

        // ✅ Validation
        if (!name || !type || !pricePerHour) {
            throw createHttpError(400, "Name, type, and pricePerHour are required");
        }

        if (pricePerHour <= 0) {
            throw createHttpError(400, "Price per hour must be greater than 0");
        }

        const newPS = await PlayStation.create({ 
            name, 
            type, 
            pricePerHour,
            status: "available"
        });

        res.status(201).json({
            success: true,
            data: newPS,
            message: "PlayStation added successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Update PlayStation
exports.updatePlayStation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, type, pricePerHour } = req.body;

        const ps = await PlayStation.findById(id);
        if (!ps) {
            throw createHttpError(404, "PlayStation not found");
        }

        // ✅ Validation
        if (pricePerHour && pricePerHour <= 0) {
            throw createHttpError(400, "Price per hour must be greater than 0");
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (type) updateData.type = type;
        if (pricePerHour) updateData.pricePerHour = pricePerHour;

        const updatedPS = await PlayStation.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: updatedPS,
            message: "PlayStation updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Delete PlayStation
exports.deletePlayStation = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const ps = await PlayStation.findById(id);
        if (!ps) {
            throw createHttpError(404, "PlayStation not found");
        }

        if (ps.status === 'occupied') {
            throw createHttpError(400, "Cannot delete an occupied PlayStation. End the session first.");
        }

        await PlayStation.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "PlayStation deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// ================== Session Management ==================

// Start Session
exports.startSession = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { playStationId } = req.body;

        if (!playStationId) {
            throw createHttpError(400, "PlayStation ID is required");
        }

        const playStation = await PlayStation.findById(playStationId).session(session);
        if (!playStation) {
            throw createHttpError(404, "PlayStation not found");
        }

        if (playStation.status === "occupied") {
            throw createHttpError(400, "PlayStation is already occupied");
        }

        // ✅ Create Session
        const psSession = await PlayStationSession.create([{
            playStationId,
            startTime: new Date(),
            pricePerHourSnapshot: playStation.pricePerHour,
            status: "active",
        }], { session });

        // ✅ Update PlayStation Status
        playStation.status = "occupied";
        playStation.currentSessionId = psSession[0]._id;
        await playStation.save({ session });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            data: {
                session: psSession[0],
                playStation
            },
            message: "Session started successfully",
        });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// Helper: Calculate session details
const calculateSessionDetails = (session, endTime) => {
    const durationMs = endTime - new Date(session.startTime);
    let durationMinutes = durationMs / (1000 * 60);
    if (durationMinutes < 0) durationMinutes = 0;

    // Calculate price: (minutes / 60) * pricePerHour
    const price = (durationMinutes / 60) * session.pricePerHourSnapshot;

    return {
        durationMinutes: parseFloat(durationMinutes.toFixed(2)),
        price: parseFloat(price.toFixed(2))
    };
};

// End Session & Create Payment
exports.endSession = async (req, res, next) => {
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        const { sessionId } = req.params;

        const psSession = await PlayStationSession.findById(sessionId).session(dbSession);
        if (!psSession) {
            throw createHttpError(404, "Session not found");
        }

        if (psSession.status === "completed") {
            throw createHttpError(400, "Session is already completed");
        }

        const endTime = new Date();
        const { durationMinutes, price } = calculateSessionDetails(psSession, endTime);

        // ✅ Fetch PlayStation
        const playStation = await PlayStation.findById(psSession.playStationId).session(dbSession);
        if (!playStation) {
            throw createHttpError(404, "PlayStation not found");
        }

        // ✅ Fetch connected orders
        const orders = await Order.find({ sessionId: psSession._id }).session(dbSession);
        let ordersTotalWithTax = 0;
        const orderItems = [];

        orders.forEach(order => {
            ordersTotalWithTax += order.bills.totalWithTax;
            // Add order items to invoice
            order.items.forEach(item => {
                orderItems.push({
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.quantity * item.unitPrice
                });
            });
        });

        // ✅ Final calculations
        const subtotal = price + ordersTotalWithTax;
        const tax = subtotal * 0.14; // 14% tax
        const finalTotal = subtotal + tax;

        // ✅ Update Session
        psSession.endTime = endTime;
        psSession.durationMinutes = durationMinutes;
        psSession.totalPrice = price;
        psSession.status = "completed";
        await psSession.save({ session: dbSession });

        // ✅ Release PlayStation
        playStation.status = "available";
        playStation.currentSessionId = null;
        await playStation.save({ session: dbSession });

        // ✅ Create Payment in Database
        const orderCode = `PS-${psSession._id.toString().slice(-6).toUpperCase()}`;

        const payment = new Payment({
            orderCode,
            sessionId: psSession._id,
            table: null, // PlayStation sessions don't have tables
            
            // ✅ Items: PlayStation time + order items
            items: [
                {
                    name: `${playStation.name} (${playStation.type})`,
                    quantity: parseFloat((durationMinutes / 60).toFixed(2)), // Hours
                    unitPrice: psSession.pricePerHourSnapshot,
                    total: price
                },
                ...orderItems
            ],
            
            bills: {
                subtotal: subtotal,
                tax: tax,
                total: finalTotal
            },
            
            customerDetails: {
                name: `PlayStation ${playStation.name}`,
                phone: "",
                guests: 1
            },
            
            paymentMethod: "Cash", // Default
            cashier: req.user?._id,
            status: "Paid",
            paidAt: new Date()
        });

        await payment.save({ session: dbSession });

        await dbSession.commitTransaction();

        // ✅ Construct Invoice Response
        const invoice = {
            playStation: { 
                name: playStation.name, 
                type: playStation.type 
            },
            session: {
                startTime: psSession.startTime,
                endTime: endTime,
                durationMinutes: durationMinutes,
                price: price
            },
            orders: orders.map(o => ({
                items: o.items,
                bills: o.bills
            })),
            payment: {
                orderCode: payment.orderCode,
                subtotal: subtotal,
                tax: tax,
                total: finalTotal
            },
            finalInvoiceTotal: parseFloat(finalTotal.toFixed(2))
        };

        res.status(200).json({
            success: true,
            message: "Session ended and payment created successfully",
            invoice
        });
    } catch (error) {
        await dbSession.abortTransaction();
        console.error("Error in endSession:", error);
        next(error);
    } finally {
        dbSession.endSession();
    }
};

// Get Invoice (for active or completed sessions)
exports.getInvoice = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        const psSession = await PlayStationSession.findById(sessionId).populate('playStationId');
        if (!psSession) {
            throw createHttpError(404, "Session not found");
        }

        let endTime = psSession.endTime;
        let durationMinutes = psSession.durationMinutes;
        let price = psSession.totalPrice;

        // If active, calculate current values dynamically
        if (psSession.status === 'active') {
            endTime = new Date();
            const details = calculateSessionDetails(psSession, endTime);
            durationMinutes = details.durationMinutes;
            price = details.price;
        }

        // Fetch connected orders
        const orders = await Order.find({ sessionId: psSession._id }).populate('table');
        let ordersTotalWithTax = 0;
        orders.forEach(order => {
            ordersTotalWithTax += order.bills.totalWithTax;
        });

        const subtotal = price + ordersTotalWithTax;
        const tax = subtotal * 0.14;
        const finalTotal = subtotal + tax;

        const invoice = {
            playStation: { 
                name: psSession.playStationId.name, 
                type: psSession.playStationId.type 
            },
            session: {
                startTime: psSession.startTime,
                endTime: endTime || "Ongoing",
                durationMinutes: durationMinutes,
                price: price,
                status: psSession.status
            },
            orders: orders.map(o => ({
                items: o.items,
                bills: o.bills,
                table: o.table ? { 
                    name: o.table.tableNo, 
                    location: o.table.status 
                } : null
            })),
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            finalInvoiceTotal: parseFloat(finalTotal.toFixed(2))
        };

        res.status(200).json({
            success: true,
            invoice
        });

    } catch (error) {
        next(error);
    }
};