import cloudinary from "../config/cloudinary";
import ErrorHandler from "./ErrorHandler";

export const deleteImageFromCloudinary = async (imageUrl: string) => {
  try {
    if (!imageUrl) throw new Error("No image URL provided");

    const cleanUrl = imageUrl.split("?")[0];

    const uploadIndex = cleanUrl.indexOf("/upload/");
    if (uploadIndex === -1) throw new Error("Invalid Cloudinary URL");

    let publicId = cleanUrl.substring(uploadIndex + 8);

    publicId = publicId.replace(/^v\d+\//, "");

    publicId = publicId.replace(/\.[^/.]+$/, "");

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw new ErrorHandler("Failed to delete image from Cloudinary", 500);
  }
};
