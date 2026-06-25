import { v2 as cloudinary } from "cloudinary";
import configureCloudinary from "./cloudinaryConfig.ts";
import { CLOUDINARY_UPLOAD_PRESET } from "./constants.ts";

const moveFilesBetweenFolders = async ({
  oldFolder,
  newFolder,
}: {
  oldFolder: string;
  newFolder: string;
}): Promise<string | string[]> => {
  configureCloudinary();

  try {
    const fullOldFolder = `${CLOUDINARY_UPLOAD_PRESET}/${oldFolder}`;
    const fullNewFolder = `${CLOUDINARY_UPLOAD_PRESET}/${newFolder}`;

    const { resources } = await cloudinary.api.resources({
      type: "upload",
      prefix: fullOldFolder,
      max_results: 500,
    });

    if (!resources.length) {
      return `No files found in the folder: ${oldFolder}`;
    }

    const movePromises = resources.map(async (file: { public_id: string }) => {
      const newPublicId = file.public_id.replace(fullOldFolder, fullNewFolder);
      const response = await cloudinary.uploader.rename(file.public_id, newPublicId);
      return response.secure_url;
    });

    return Promise.all(movePromises);
  } catch (error) {
    return `Error moving files: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

export default moveFilesBetweenFolders;
