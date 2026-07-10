import { v2 as cloudinary } from "cloudinary";
import connectDb from "@/app/api/db/connectDb";
import Article from "@/app/api/models/article";
import mongoose from "mongoose";
import uploadFilesCloudinaryLib from "@/lib/cloudinary/uploadFilesCloudinary";
import deleteFilesCloudinaryLib from "@/lib/cloudinary/deleteFilesCloudinary";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true,
});

export interface UploadImageParams {
  imageFile: File;
  folderId: string;
}

export interface UploadImageResult {
  imageUrl: string;
  publicId: string;
  folder: string;
}

export async function uploadImageService(
  params: UploadImageParams
): Promise<UploadImageResult> {
  const { imageFile, folderId } = params;

  // Validate required fields
  if (!imageFile || !folderId) {
    throw new Error("Image file and folderId are required!");
  }

  // Validate image file
  if (!(imageFile instanceof File) || !imageFile.type.startsWith("image/")) {
    throw new Error("Only image files are allowed!");
  }

  // Validate file size (optional - 10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (imageFile.size > maxSize) {
    throw new Error("Image file size must be less than 10MB!");
  }

  // Validate folderId format (should be a valid ObjectId or string)
  if (typeof folderId !== "string" || folderId.trim().length === 0) {
    throw new Error("Invalid folderId format!");
  }

  // Convert file to data URI
  const arrayBuffer = await imageFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const dataUri = `data:${imageFile.type};base64,${buffer.toString("base64")}`;

  // Upload preset
  const uploadPreset = "health";
  
  // Create folder path using the provided ID
  const folderPath = `/${folderId}`;

  // Upload to Cloudinary
  const response = await cloudinary.uploader.upload(dataUri, {
    invalidate: true,
    upload_preset: uploadPreset,
    folder: `${uploadPreset}${folderPath}`,
    resource_type: "auto",
  });

  // Connect to database and update article with new image URL
  try {
    await connectDb();
    
    // Check if article exists
    if (mongoose.Types.ObjectId.isValid(folderId)) {
      const article = await Article.findById(folderId);
      if (article) {
        // Update the article's articleImages array with the new image URL
        await Article.findByIdAndUpdate(
          folderId,
          { $addToSet: { articleImages: response.secure_url } },
          { new: true }
        );
      } else {
        console.warn(`Article with ID ${folderId} not found, but image uploaded successfully`);
      }
    }
  } catch (dbError) {
    console.error("Failed to update article with image URL:", dbError);
    // Don't fail the entire request if database update fails
    // The image was successfully uploaded to Cloudinary
  }

  return {
    imageUrl: response.secure_url,
    publicId: response.public_id,
    folder: folderPath,
  };
}

export async function checkArticlePermissionService(
  articleId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    return false;
  }

  await connectDb();

  const article = await Article.findById(articleId).select("createdBy");

  if (!article) {
    return false;
  }

  const isAuthor = article.createdBy.toString() === userId;
  const isAdmin = userRole === "admin";

  return isAuthor || isAdmin;
}

// Service wrapper for multiple file uploads
export interface UploadFilesServiceParams {
  folder: string;
  filesArr: File[];
  onlyImages?: boolean;
}

export async function uploadFilesService(
  params: UploadFilesServiceParams
): Promise<string[]> {
  const { folder, filesArr, onlyImages = true } = params;

  if (!folder || !filesArr || filesArr.length === 0) {
    throw new Error("Folder and files array are required");
  }

  // Validate files
  if (onlyImages) {
    const invalidFiles = filesArr.filter(
      (file) => !(file instanceof File) || !file.type.startsWith("image/")
    );
    if (invalidFiles.length > 0) {
      throw new Error("Only image files are allowed");
    }
  }

  // Validate file sizes (10MB limit per file)
  const maxSize = 10 * 1024 * 1024; // 10MB
  const oversizedFiles = filesArr.filter((file) => file.size > maxSize);
  if (oversizedFiles.length > 0) {
    throw new Error("File size must be less than 10MB per file");
  }

  // Call the Cloudinary library function
  const result = await uploadFilesCloudinaryLib({
    folder,
    filesArr,
    onlyImages,
  });

  // Validate result
  if (typeof result === "string") {
    throw new Error(`Upload failed: ${result}`);
  }

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error("Upload failed: No files were uploaded");
  }

  if (!result.every((url) => typeof url === "string" && url.includes("https://"))) {
    throw new Error("Upload failed: Invalid response format");
  }

  return result;
}

// Service wrapper for file deletion (single image URL)
export interface DeleteFileServiceParams {
  imageUrl: string | undefined;
}

export async function deleteFileService(
  params: DeleteFileServiceParams
): Promise<void> {
  const { imageUrl } = params;

  // Call the Cloudinary library function
  const result = await deleteFilesCloudinaryLib(imageUrl);

  // Validate result
  if (result === true) {
    return; // Success
  }

  // If result is a string, it's an error message
  if (typeof result === "string") {
    throw new Error(result);
  }

  throw new Error("Delete file failed");
}

