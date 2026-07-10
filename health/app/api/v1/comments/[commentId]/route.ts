import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { deleteCommentService } from "@/lib/services/comments";

// @desc    Delete comment
// @route   DELETE /api/v1/comments/[commentId]
// @access  Private
export const DELETE = async (
  req: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "You must be signed in to delete comments",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { commentId } = await context.params;

    if (!commentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Comment ID is required",
        },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === "admin";
    await deleteCommentService(commentId, session.user.id, isAdmin);

    return NextResponse.json(
      {
        success: true,
        message: "Comment deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Delete comment failed!", error as string);
  }
};
