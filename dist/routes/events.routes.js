"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EventControllers = __importStar(require("../controllers/event.controllers"));
const isAuthenticated_1 = require("../middlewares/isAuthenticated");
const isAuthorized_1 = require("../middlewares/isAuthorized");
const uploadToCloudinary_1 = require("../utils/uploadToCloudinary");
const router = (0, express_1.Router)();
// test events api route
router.get("/", (_req, res) => {
    res.send("Events API Running Successfully");
});
// create event route
router.post("/create", isAuthenticated_1.isAuthenticated, (0, isAuthorized_1.isAuthorized)(["ORGANIZER"]), uploadToCloudinary_1.upload.fields([
    { name: "thumbnail", maxCount: 1 }, // required
    { name: "media", maxCount: 10 }, // optional
]), EventControllers.createEvent);
// get all events route
router.get("/all", EventControllers.getAllEvents);
// get my events route
router.get("/my-events", isAuthenticated_1.isAuthenticated, (0, isAuthorized_1.isAuthorized)(["ORGANIZER"]), EventControllers.getMyEvents);
// get event by id route
router.get("/:id", EventControllers.getEventById);
// update event route
router.put("/update/:id", isAuthenticated_1.isAuthenticated, (0, isAuthorized_1.isAuthorized)(["ORGANIZER"]), uploadToCloudinary_1.upload.fields([
    { name: "thumbnail", maxCount: 1 }, // optional
    { name: "media", maxCount: 10 }, // optional
]), EventControllers.updateEventById);
// delete event route
router.delete("/delete/:id", isAuthenticated_1.isAuthenticated, (0, isAuthorized_1.isAuthorized)(["ORGANIZER"]), EventControllers.deleteEventById);
// delete Attachment route
router.delete("/delete-attachment/:id", isAuthenticated_1.isAuthenticated, (0, isAuthorized_1.isAuthorized)(["ORGANIZER"]), EventControllers.deleteAttachmentById);
exports.default = router;
//# sourceMappingURL=events.routes.js.map