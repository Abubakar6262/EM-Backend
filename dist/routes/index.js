"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const events_routes_1 = __importDefault(require("./events.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const participant_routes_1 = __importDefault(require("./participant.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/user", user_routes_1.default);
router.use("/events", events_routes_1.default);
router.use("/participant", participant_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map