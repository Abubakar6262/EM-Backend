import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";
import path from "path";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let format = file.mimetype.split("/")[1]; // e.g., svg+xml
    if (format === "svg+xml") format = "svg"; // normalize SVG

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

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

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

export const upload = multer({ storage, fileFilter });
