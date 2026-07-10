import { v2 as cloudinary } from "cloudinary";

// Cloudinary ENV variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true,
});

export default async function deleteFilesCloudinary(
  imageUrl: string | undefined
): Promise<boolean | string> {
  try {
    // example of a cloudinary image url
    // https://res.cloudinary.com/jpsm83/image/upload/v1750673781/health/users/685921b62c6db61122c9302b/uowx3qxhiyns1j7j69jf.jpg
    if (imageUrl) {
      // Extract cloudinaryPublicId using regex
      // example of a publicId
      // health/users/685921b62c6db61122c9302b/uowx3qxhiyns1j7j69jf.jpg
      const cloudinaryPublicId = imageUrl.match(/health\/[^.]+/);

      const deletionResponse = await cloudinary.uploader.destroy(
        cloudinaryPublicId?.[0] ?? "",
        {
          resource_type: "image",
        }
      );

      if (deletionResponse.result !== "ok") {
        return "DeleteCloudinaryImage failed!";
      }
    }
    return true;
  } catch (error) {
    return `Error trying to delete image: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }
}
