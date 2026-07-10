import { NextRequest, NextResponse } from "next/server";
import sendCommentReportEmailAction from "@/app/actions/user/commentReport";
import { handleApiError } from "@/app/api/utils/handleApiError";

// @desc    Send comment report email notification
// @route   POST /api/v1/users/comment-report
// @access  Public
export const POST = async (req: NextRequest) => {
  try {
    const { email, username, commentText, reason, articleTitle, locale } = await req.json();

    // Validate required fields
    if (!email || !username || !commentText || !reason || !articleTitle) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Email, username, comment text, reason, and article title are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use the action to handle comment report email
    const result = await sendCommentReportEmailAction(
      email,
      username,
      commentText,
      reason,
      articleTitle,
      locale || 'en'
    );

    if (!result.success) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Failed to send comment report email",
          error: 'error' in result ? result.error : "Unknown error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "Comment report email sent successfully",
        data: 'data' in result ? result.data : undefined
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleApiError("Comment report email failed!", error as string);
  }
};
