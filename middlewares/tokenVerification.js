const jwt = require("jsonwebtoken");
const createHttpError = require("http-errors");
const config = require("../config/config");
const User = require("../models/userModel");

const isVerifiedUser = async (req, res, next) => {
    try {
        let token = null;

        // ✅ Check 1: Cookie (primary method)
        if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
            console.log("✅ Token found in cookie");
        }

        // ✅ Check 2: Authorization header (backup)
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
                console.log("✅ Token found in header");
            }
        }

        if (!token) {
            console.log("❌ No token found");
            throw createHttpError(401, "Access denied. No token provided.");
        }

        // ✅ Verify token
        console.log("🔍 Verifying token...");
        console.log("Token (first 30 chars):", token.substring(0, 30) + "...");
        console.log("JWT Secret exists:", !!config.jwtSecret);
        
        const decoded = jwt.verify(token, config.jwtSecret);
        console.log("✅ Token decoded:", { id: decoded.id, role: decoded.role });

        // ✅ Get user from database
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            console.log("❌ User not found in database for ID:", decoded.id);
            throw createHttpError(401, "User not found");
        }

        // ✅ Attach user to request
        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };

        console.log("✅ User verified:", user.email, "-", user.role);
        next();

    } catch (error) {
        console.error("❌ Token verification error:", error.message);
        
        if (error.name === "JsonWebTokenError") {
            console.log("❌ Invalid token format or signature");
            return next(createHttpError(401, "Invalid token"));
        }
        if (error.name === "TokenExpiredError") {
            console.log("❌ Token expired");
            res.clearCookie("accessToken");
            return next(createHttpError(401, "Token expired"));
        }
        next(error);
    }
};

module.exports = { isVerifiedUser };