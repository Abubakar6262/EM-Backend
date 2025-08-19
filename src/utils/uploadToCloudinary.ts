import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

// Setup multer-cloudinary storage with dynamic folder
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: req.body.folder || "Event_Management/User_Profile_Pics",
      format: file.mimetype.split("/")[1], // keep original format (jpg/png)
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`, // unique file name
    };
  },
});

export const upload = multer({ storage });
