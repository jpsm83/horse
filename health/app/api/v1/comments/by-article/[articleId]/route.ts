import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { getCommentsService } from "@/lib/services/comments";

// @desc    Get comments by article
// @route   GET /api/v1/comments/by-article/[articleId]
// @access  Public
export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ articleId: string }> }
) => {
  try {
    const { articleId } = await context.params;
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "createdAt";
    const order = (searchParams.get("order") as "asc" | "desc") || "desc";
    
    if (!articleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Article ID is required",
        },
        { status: 400 }
      );
    }

    const result = await getCommentsService({
      articleId,
      page,
      limit,
      sort,
      order,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Get comments by article failed!", error as string);
  }
};
