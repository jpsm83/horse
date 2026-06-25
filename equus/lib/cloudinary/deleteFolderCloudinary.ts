import { v2 as cloudinary } from "cloudinary";
import configureCloudinary from "./cloudinaryConfig.ts";
import { CLOUDINARY_UPLOAD_PRESET } from "./constants.ts";

const deleteFolderCloudinary = async (folderPath: string): Promise<boolean | string> => {
  try {
    configureCloudinary();

    await cloudinary.api.delete_resources_by_prefix(CLOUDINARY_UPLOAD_PRESET + folderPath);
    await cloudinary.api.delete_folder(CLOUDINARY_UPLOAD_PRESET + folderPath);

    return true;
  } catch (error: unknown) {
    console.error("Cloudinary cleanup failed:", error instanceof Error ? error.message : error);
    return false;
  }
};

export default deleteFolderCloudinary;
