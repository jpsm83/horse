import { v2 as cloudinary } from "cloudinary";

// Cloudinary ENV variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true,
});

export default async function uploadFilesCloudinary({
  folder,
  filesArr,
  onlyImages,
}: {
  folder: string;
  filesArr: File[];
  onlyImages?: boolean;
}): Promise<string | string[]> {
  const uploadPreset = "health";

  // Validate file types
  if (onlyImages) {
    for (const file of filesArr) {
      if (!(file instanceof File) || !file.type.startsWith("image/")) {
        return "Only images can be uploaded!";
      }
    }
  }

  try {
    // Convert files to data URIs
    const uploadPromises = filesArr.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create a data URI
      const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

      // Upload to Cloudinary
      const response = await cloudinary.uploader.upload(dataUri, {
        // because we are using non signature, the invalidate is not needed
        invalidate: true,
        upload_preset: uploadPreset,
        folder: `${uploadPreset}${folder}`,
        resource_type: "auto",
      });

      return response.secure_url;
    });

    // Wait for all files to upload
    const uploadedUrls = await Promise.all(uploadPromises);

    return uploadedUrls;
  } catch (error) {
    return `Error trying to upload images: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }
}