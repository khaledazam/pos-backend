const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const config = require("./config/config");

const app = express();

// ✅ 1. CORS - MUST BE FIRST
app.use(cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true,                 // MUST BE TRUE for cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"]
}));

// ✅ 2. COOKIE PARSER - BEFORE ROUTES
app.use(cookieParser());

// ✅ 3. BODY PARSER
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 4. LOGGING MIDDLEWARE (for debugging)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    if (req.cookies) {
        console.log("Cookies:", Object.keys(req.cookies));
    }
    next();
});

const { seedFixedUsers } = require("./controllers/userController");

// ✅ 5. DATABASE CONNECTION
mongoose
    .connect(config.databaseURI || "mongodb://localhost:27017/pos-system")
    .then(() => {
        console.log("✅ MongoDB Connected");
        seedFixedUsers(); // ✅ Seed users on startup
    })
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ 6. ROUTES
const userRoutes = require("./routes/userRoute");
const tableRoutes = require("./routes/tableRoute");
const orderRoutes = require("./routes/orderRoute");
const paymentRoutes = require("./routes/paymentRoute");
const inventoryRoutes = require("./routes/inventoryRoute");
const playStationRoutes = require("./routes/playStationRoute");
const productRoutes = require("./routes/productRoute");
// const reportRoutes = require("./routes/reportRoute");

app.use("/api/auth", userRoutes);
app.use("/api/table", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/playstations", playStationRoutes);
app.use("/api/products", productRoutes);
    // app.use("/api/reports", reportRoutes);

// ✅ 7. TEST ROUTE (for debugging cookies)
app.get('/api/test-cookie', (req, res) => {
    console.log("📍 Test Cookie Route");
    console.log("Cookies received:", req.cookies);
    res.json({
        cookies: req.cookies,
        hasAccessToken: !!req.cookies?.accessToken,
        allHeaders: req.headers
    });
});

// ✅ 8. ERROR HANDLER
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// ✅ 9. START SERVER
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Frontend: http://localhost:5173`);
    console.log(`✅ Backend: http://localhost:${PORT}`);
});

module.exports = app;