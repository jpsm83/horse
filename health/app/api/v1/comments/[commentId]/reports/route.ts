import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { reportCommentService } from "@/lib/services/comments";
import sendCommentReportEmailAction from "@/app/actions/user/commentReport";

// @desc    Report comment
// @route   POST /api/v1/comments/[commentId]/reports
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
          message: "You must be signed in to report comments",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { commentId } = await context.params;
    const { reason } = await req.json();

    if (!commentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Comment ID is required",
        },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Report reason is required",
        },
        { status: 400 }
      );
    }

    // Report comment using service (returns data needed for email)
    const reportResult = await reportCommentService(commentId, session.user.id, reason);

    // Send email notification (external integration - keep in route)
    try {
      await sendCommentReportEmailAction(
        reportResult.comment.authorEmail,
        reportResult.comment.authorUsername,
        reportResult.comment.comment,
        reason,
        reportResult.comment.articleTitle,
        reportResult.comment.authorLanguage
      );
    } catch (emailError) {
      console.error("Failed to send comment report email:", emailError);
      // Don't fail the entire operation if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Comment reported successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Report comment failed!", error as string);
  }
};
