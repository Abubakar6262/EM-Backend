"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = isAuthenticated;
const jwt_1 = require("../utils/jwt");
function isAuthenticated(req, res, next) {
    const token = req.cookies.accessToken;
    if (!token)
        return res
            .status(401)
            .json({ message: "Please login first to access this resource" });
    try {
        const payload = (0, jwt_1.verifyAccess)(token);
        // console.log("payload ", payload)
        req.user = payload.sub; // attach userId to request
        next();
    }
    catch (err) {
        return res
            .status(401)
            .json({ error: err, message: "Invalid or expired token" });
    }
}
//# sourceMappingURL=isAuthenticated.js.map