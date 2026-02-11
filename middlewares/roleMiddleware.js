const createHttpError = require("http-errors");

// ✅ Admin Only
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role?.toLowerCase() === "admin") {
        next();
    } else {
        const error = createHttpError(403, "Access denied. Admin only.");
        next(error);
    }
};

// ✅ Cashier or Admin
const isCashier = (req, res, next) => {
    const role = req.user?.role?.toLowerCase();
    if (req.user && (role === "cashier" || role === "admin")) {
        next();
    } else {
        const error = createHttpError(403, "Access denied. Cashier or Admin only.");
        next(error);
    }
};

module.exports = { isAdmin, isCashier };