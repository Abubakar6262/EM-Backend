"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueTokens = issueTokens;
exports.verifyAccess = verifyAccess;
exports.verifyRefresh = verifyRefresh;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
async function issueTokens(userId) {
    const accessToken = jsonwebtoken_1.default.sign({ sub: userId }, env_1.ENV.ACCESS_SECRET, {
        expiresIn: env_1.ENV.ACCESS_EXPIRES,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ sub: userId }, env_1.ENV.REFRESH_SECRET, {
        expiresIn: env_1.ENV.REFRESH_EXPIRES,
    });
    // compute refresh expiry date
    const decoded = jsonwebtoken_1.default.decode(refreshToken);
    const refreshExp = new Date(decoded.exp * 1000);
    return { accessToken, refreshToken, refreshExp };
}
function verifyAccess(token) {
    return jsonwebtoken_1.default.verify(token, env_1.ENV.ACCESS_SECRET);
}
function verifyRefresh(token) {
    return jsonwebtoken_1.default.verify(token, env_1.ENV.REFRESH_SECRET);
}
//# sourceMappingURL=jwt.js.map