"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromCloudinary = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const ErrorHandler_1 = __importDefault(require("./ErrorHandler"));
const deleteImageFromCloudinary = async (imageUrl) => {
    try {
        if (!imageUrl)
            throw new Error("No image URL provided");
        const cleanUrl = imageUrl.split("?")[0];
        const uploadIndex = cleanUrl.indexOf("/upload/");
        if (uploadIndex === -1)
            throw new Error("Invalid Cloudinary URL");
        let publicId = cleanUrl.substring(uploadIndex + 8);
        publicId = publicId.replace(/^v\d+\//, "");
        publicId = publicId.replace(/\.[^/.]+$/, "");
        // Delete from Cloudinary
        const result = await cloudinary_1.default.uploader.destroy(publicId);
        return result;
    }
    catch (error) {
        console.error("Cloudinary deletion error:", error);
        throw new ErrorHandler_1.default("Failed to delete image from Cloudinary", 500);
    }
};
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
//# sourceMappingURL=deleteImageFromCloudinary.js.map