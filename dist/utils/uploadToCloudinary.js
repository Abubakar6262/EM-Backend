"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// Setup multer-cloudinary storage with dynamic folder
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: async (req, file) => {
        return {
            folder: req.body.folder || "Event_Management/User_Profile_Pics",
            format: file.mimetype.split("/")[1],
            public_id: `${Date.now()}-${file.originalname
                .split(".")[0]
                .replace(/[^a-zA-Z0-9-_]/g, "_")}`,
        };
    },
});
exports.upload = (0, multer_1.default)({ storage });
//# sourceMappingURL=uploadToCloudinary.js.map