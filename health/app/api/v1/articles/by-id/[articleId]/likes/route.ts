import { NextResponse } from "next/server";
import isObjectIdValid from "@/app/api/utils/isObjectIdValid";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import {
  toggleArticleLikeService,
  getArticleLikeStatusService,
} from "@/lib/services/articles";

// @desc    Toggle article like (add if not liked, remove if already liked)
// @route   POST /api/v1/likes/articles/[articleId]
// @access  Private
export const POST = async (
  req: Request,
  context: { params: Promise<{ articleId: string }> }
) => {
  try {
    const { articleId } = await context.params;

    // ------------------------
    // Validate articleId format
    // ------------------------
    if (!isObjectIdValid([articleId])) {
      return new NextResponse(
        JSON.stringify({ 
          success: false,
          message: "Invalid article ID format" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ------------------------
    // Check authentication
    // ------------------------
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "You must be signed in to toggle article likes",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // ------------------------
    // Toggle like using service
    // ------------------------
    const { liked, likeCount } = await toggleArticleLikeService(
      articleId,
      session.user.id
    );

    // ------------------------
    // Return success response
    // ------------------------
    return NextResponse.json(
      {
        success: true,
        liked,
        likeCount,
        message: liked ? "Article liked" : "Article unliked",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Toggle article like failed!", error as string);
  }
};

// @desc    Get article like status and count
// @route   GET /api/v1/likes/articles/[articleId]
// @access  Public
export const GET = async (
  req: Request,
  context: { params: Promise<{ articleId: string }> }
) => {
  try {
    const { articleId } = await context.params;

    // ------------------------
    // Validate articleId format
    // ------------------------
    if (!isObjectIdValid([articleId])) {
      return new NextResponse(
        JSON.stringify({ 
          success: false,
          message: "Invalid article ID format" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ------------------------
    // Get article like information
    // ------------------------
    const session = await auth();
    const userId = session?.user?.id;

    const { likeCount, userLiked } = await getArticleLikeStatusService(
      articleId,
      userId
    );

    return new NextResponse(
      JSON.stringify({
        success: true,
        likeCount,
        userLiked,
        message: "Article like status retrieved successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError("Get article like status failed!", error as string);
  }
};
