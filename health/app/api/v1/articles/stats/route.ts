import { NextResponse } from "next/server";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import { getArticleStatsService } from "@/lib/services/articles";

// @desc    Get article statistics
// @route   GET /api/v1/articles/stats
// @access  Private (Admin only)
export const GET = async () => {
  try {
    // ------------------------
    // Check authentication
    // ------------------------
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be signed in to access statistics",
        },
        { status: 401 }
      );
    }

    // ------------------------
    // Check admin role
    // ------------------------
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 }
      );
    }

    // ------------------------
    // Get stats using service
    // ------------------------
    const stats = await getArticleStatsService();

    // ------------------------
    // Return success response
    // ------------------------
    return NextResponse.json(
      {
        success: true,
        data: stats,
        message: "Article statistics retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Get article statistics failed!", error as string);
  }
};
