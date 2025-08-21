"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = isAuthenticated;
const jwt_1 = require("../utils/jwt");
function isAuthenticated(req, res, next) {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    if (!accessToken) {
        if (refreshToken) {
            return res.status(401).json({ message: "Please update access token" });
        }
        else {
            return res
                .status(401)
                .json({ message: "Please login first to access this resource" });
        }
    }
    try {
        const payload = (0, jwt_1.verifyAccess)(accessToken);
        req.user = payload.sub; // attach userId to request
        next();
    }
    catch (err) {
        if (refreshToken) {
            return res.status(401).json({ message: "Please update access token" });
        }
        return res
            .status(401)
            .json({
            error: err,
            message: "Invalid or expired token. Please login again.",
        });
    }
}
//# sourceMappingURL=isAuthenticated.js.map