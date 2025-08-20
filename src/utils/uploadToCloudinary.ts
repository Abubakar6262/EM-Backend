// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "../config/cloudinary";

// // Setup multer-cloudinary storage with dynamic folder
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => {
//     return {
//       folder: req.body.folder || "Event_Management/User_Profile_Pics",
//       format: file.mimetype.split("/")[1],
//       public_id: `${Date.now()}-${file.originalname
//         .split(".")[0]
//         .replace(/[^a-zA-Z0-9-_]/g, "_")}`,
//     };
//   },
// });


// export const upload = multer({ storage });


import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let format = file.mimetype.split("/")[1]; // e.g., svg+xml
    if (format === "svg+xml") format = "svg"; // normalize SVG

    return {
      folder: req.body.folder || "Event_Management/User_Profile_Pics",
      format, // now png/jpg/jpeg/svg works
      public_id: `${Date.now()}-${file.originalname
        .split(".")[0]
        .replace(/[^a-zA-Z0-9-_]/g, "_")}`,
      resource_type: file.mimetype.startsWith("image/")
        ? "image"
        : file.mimetype.startsWith("video/")
        ? "video"
        : "raw", // for documents, PDFs, etc.
    };
  },
});

export const upload = multer({ storage });
