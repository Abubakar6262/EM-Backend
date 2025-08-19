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
const UserController = __importStar(require("../controllers/user.controllers"));
const isAuthenticated_1 = require("../middlewares/isAuthenticated");
const uploadToCloudinary_1 = require("../utils/uploadToCloudinary");
const isAuthorized_1 = require("../middlewares/isAuthorized");
const router = (0, express_1.Router)();
// test user api route
router.get("/", (_req, res) => {
    res.send("user API Running Successfully");
});
// get current user route
router.get("/me", isAuthenticated_1.isAuthenticated, UserController.getMe);
// get all users route
router.get("/all", isAuthenticated_1.isAuthenticated, (0, isAuthorized_1.isAuthorized)(["ORGANIZER"]), UserController.getAllUsers);
// update user role
router.put("/update-user-role", isAuthenticated_1.isAuthenticated, (0, isAuthorized_1.isAuthorized)(["ORGANIZER"]), UserController.updateUserRole);
// Update userInfo
router.put("/update-user-info", isAuthenticated_1.isAuthenticated, UserController.updateUserInfo);
// Update user profile pic
router.put("/update-profile-pic", isAuthenticated_1.isAuthenticated, uploadToCloudinary_1.upload.single("profilePic"), UserController.updateProfilePic);
// update user password
router.put("/update-password", isAuthenticated_1.isAuthenticated, UserController.updatePassword);
exports.default = router;
//# sourceMappingURL=user.routes.js.map