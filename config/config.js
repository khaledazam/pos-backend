require("dotenv").config();

const config = Object.freeze({
    // Server Configuration
    port: process.env.PORT || 8000,
    nodeEnv: process.env.NODE_ENV || "development",
    
    // Database Configuration
    mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/pos-db",
    databaseURI: process.env.MONGODB_URI || "mongodb://localhost:27017/pos-db",
    
    // JWT Configuration - MOST IMPORTANT!
    jwtSecret: process.env.JWT_SECRET || "fallback-secret-key",
    accessTokenSecret: process.env.JWT_SECRET || "fallback-secret-key",
    
    // Razorpay (Optional - for payments)
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
    razorpaySecretKey: process.env.RAZORPAY_KEY_SECRET || null,
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || null,
    
    // CORS
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
});

// Validation
if (!config.jwtSecret || config.jwtSecret === "fallback-secret-key") {
    console.warn("⚠️  WARNING: JWT_SECRET not found in .env!");
}

module.exports = config;