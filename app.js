const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const config = require("./config/config");

const app = express();

/* =========================
   1️⃣ CORS (CORRECT SETUP)
========================= */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      'https://pos2-third-cmjd.vercel.app',
      // Vercel URL
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =========================
   2️⃣ COOKIE PARSER
========================= */
app.use(cookieParser());

/* =========================
   3️⃣ BODY PARSER
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   4️⃣ LOGGING (DEBUG)
========================= */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    console.log("Cookies:", Object.keys(req.cookies));
  }
  next();
});

const { seedFixedUsers } = require("./controllers/userController");

/* =========================
   5️⃣ DATABASE
========================= */
mongoose
  .connect(config.databaseURI || "mongodb://localhost:27017/pos-system")
  .then(() => {
    console.log("✅ MongoDB Connected");
    seedFixedUsers();
  })
  .catch((err) =>
    console.error("❌ MongoDB Connection Error:", err.message)
  );

/* =========================
   6️⃣ ROUTES
========================= */
app.use("/api/auth", require("./routes/userRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/orders", require("./routes/orderRoute"));
app.use("/api/payments", require("./routes/paymentRoute"));
app.use("/api/inventory", require("./routes/inventoryRoute"));
app.use("/api/playstations", require("./routes/playStationRoute"));
app.use("/api/products", require("./routes/productRoute"));
// app.use("/api/reports", require("./routes/reportRoute"));

/* =========================
   7️⃣ TEST COOKIE ROUTE
========================= */
app.get("/api/test-cookie", (req, res) => {
  res.json({
    cookies: req.cookies,
    hasAccessToken: !!req.cookies?.accessToken,
    headers: req.headers,
  });
});

/* =========================
   8️⃣ GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   9️⃣ START SERVER
========================= */
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
