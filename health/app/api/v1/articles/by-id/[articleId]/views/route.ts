import { NextResponse } from "next/server";
import isObjectIdValid from "@/app/api/utils/isObjectIdValid";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { incrementArticleViewsService } from "@/lib/services/articles";

// @desc    Increment article views
// @route   POST /api/v1/articles/by-id/[articleId]/views
// @access  Public
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
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid article ID format" 
        },
        { status: 400 }
      );
    }

    // ------------------------
    // Increment views using service
    // ------------------------
    const views = await incrementArticleViewsService(articleId);

    // ------------------------
    // Return success response
    // ------------------------
    return NextResponse.json(
      {
        success: true,
        views,
        message: "Article views incremented successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Increment article views failed!", error as string);
  }
};
