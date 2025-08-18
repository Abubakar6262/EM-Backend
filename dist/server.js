"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
const env_1 = require("./config/env");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    // origin: "http://localhost:3000", // frontend URL
    origin: "*", // frontend URL
    credentials: true, // allow cookies
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get("/health", (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
});
// API routes
app.use("/api", routes_1.default);
// Error handler
app.use(error_middleware_1.default);
// Start server
app.listen(env_1.ENV.PORT, () => {
    console.log(` Server running at http://localhost:${env_1.ENV.PORT}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map