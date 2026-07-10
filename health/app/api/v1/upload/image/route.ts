import { NextResponse } from "next/server";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import { checkAuthWithApiKey } from "@/lib/utils/apiKeyAuth";
import { uploadImageService, checkArticlePermissionService } from "@/lib/services/upload";

// @desc    Upload single image to Cloudinary
// @route   POST /upload/image
// @access  Private (Session or API Key)
export const POST = async (req: Request) => {
  // Validate session or API key
  const session = await auth();
  const authError = checkAuthWithApiKey(req, session);
  
  if (authError) {
    return authError;
  }

  try {
    // Parse form data
    const formData = await req.formData();
    
    // Extract image file and folder ID
    const imageFile = formData.get("image") as File;
    const folderId = formData.get("folderId") as string;

    // For session authentication, check if user has permission to update the article
    if (session) {
      const hasPermission = await checkArticlePermissionService(
        folderId,
        session.user.id,
        session.user.role
      );

      if (!hasPermission) {
        return new NextResponse(
          JSON.stringify({
            message: "You are not authorized to add images to this article",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Upload image using service
    const result = await uploadImageService({ imageFile, folderId });

    // Return success response with image URL
    return new NextResponse(
      JSON.stringify({
        message: "Image uploaded successfully!",
        imageUrl: result.imageUrl,
        publicId: result.publicId,
        folder: result.folder,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Image upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Handle validation errors
    if (
      errorMessage.includes("required") ||
      errorMessage.includes("Only image files") ||
      errorMessage.includes("file size") ||
      errorMessage.includes("Invalid folderId")
    ) {
      return new NextResponse(
        JSON.stringify({
          message: errorMessage,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new NextResponse(
      JSON.stringify({
        message: `Image upload failed: ${errorMessage}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};