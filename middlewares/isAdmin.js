const createHttpError = require("http-errors");

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role && req.user.role.toLowerCase() === "admin") {
        next();
    } else {
        const error = createHttpError(403, "Access denied. Admin only.");
        next(error);
    }
};

module.exports = { isAdmin };
