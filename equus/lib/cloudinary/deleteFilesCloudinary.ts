import { v2 as cloudinary } from "cloudinary";
import configureCloudinary from "./cloudinaryConfig.ts";
import { CLOUDINARY_UPLOAD_PRESET } from "./constants.ts";

const deleteFilesCloudinary = async (
  imageUrl: string | undefined,
): Promise<boolean | string> => {
  configureCloudinary();

  try {
    if (imageUrl) {
      const pattern = new RegExp(`${CLOUDINARY_UPLOAD_PRESET}\\/[^.]+`);
      const cloudinaryPublicId = imageUrl.match(pattern);

      if (!cloudinaryPublicId?.[0]) {
        return true;
      }

      const deletionResponse = await cloudinary.uploader.destroy(cloudinaryPublicId[0], {
        resource_type: "image",
      });

      if (deletionResponse.result !== "ok" && deletionResponse.result !== "not found") {
        return "DeleteCloudinaryImage failed!";
      }
    }
    return true;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : (() => {
              try {
                return JSON.stringify(error);
              } catch {
                return String(error);
              }
            })();

    return `DeleteCloudinaryImage failed: ${message || "Unknown error"}`;
  }
};

export default deleteFilesCloudinary;
