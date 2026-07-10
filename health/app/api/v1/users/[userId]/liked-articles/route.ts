import { NextResponse } from "next/server";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import isObjectIdValid from "@/app/api/utils/isObjectIdValid";
import { getUserLikedArticlesService } from "@/lib/services/users";

// @desc    Get user's liked articles
// @route   GET /api/v1/users/[userId]/liked-articles
// @access  Private (User can only access their own liked articles)
export const GET = async (
  req: Request,
  context: { params: Promise<{ userId: string }> }
) => {
  try {
    // Validate session
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({
          message: "You must be signed in to view liked articles",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { userId } = await context.params;

    if (!userId) {
      return new NextResponse(
        JSON.stringify({
          message: "User ID is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user is trying to access their own liked articles
    if (session.user.id !== userId) {
      return new NextResponse(
        JSON.stringify({
          message: "You can only access your own liked articles",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate ObjectId
    if (!isObjectIdValid([userId])) {
      return NextResponse.json(
        { message: "Invalid user ID format!" },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "6");
    const locale = searchParams.get("locale") || "en";

    try {
      const result = await getUserLikedArticlesService(userId, page, limit, locale);

      if (result.articles.length === 0) {
        return NextResponse.json(
          {
            success: true,
            data: [],
            totalDocs: 0,
            totalPages: 0,
            currentPage: page,
            message: "No liked articles found!",
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: result.articles,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
        },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return NextResponse.json({ message: "User not found!" }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    return handleApiError("Get user liked articles failed!", error as string);
  }
};
