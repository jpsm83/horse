import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { toggleCommentLikeService } from "@/lib/services/comments";

// @desc    Toggle comment like
// @route   POST /api/v1/comments/[commentId]/likes
// @access  Private
export const POST = async (
  req: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "You must be signed in to like comments",
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

    const { liked, likeCount } = await toggleCommentLikeService(
      commentId,
      session.user.id
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          liked,
          likeCount,
          message: liked ? "Comment liked" : "Comment unliked",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Toggle comment like failed!", error as string);
  }
};
