"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const path_1 = __importDefault(require("path"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: async (req, file) => {
        let format = file.mimetype.split("/")[1]; // e.g., svg+xml
        if (format === "svg+xml")
            format = "svg"; // normalize SVG
        return {
            folder: req.body.folder || "Event_Management/User_Profile_Pics",
            format,
            public_id: `${Date.now()}-${file.originalname
                .split(".")[0]
                .replace(/[^a-zA-Z0-9-_]/g, "_")}`,
            resource_type: file.mimetype.startsWith("image/")
                ? "image"
                : file.mimetype.startsWith("video/")
                    ? "video"
                    : "raw",
        };
    },
});
// Allowed extensions
const imageExts = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const fileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (file.fieldname === "thumbnail") {
        if (!imageExts.includes(ext)) {
            return cb(new Error("Thumbnail must be PNG, JPG, JPEG, SVG, or WEBP"));
        }
    }
    if (file.fieldname === "media") {
        if (![...imageExts, ...videoExts].includes(ext)) {
            return cb(new Error("Media must be an image or video"));
        }
    }
    cb(null, true);
};
exports.upload = (0, multer_1.default)({ storage, fileFilter });
//# sourceMappingURL=uploadToCloudinary.js.map