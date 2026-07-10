import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { getCommentsService, createCommentService } from "@/lib/services/comments";

// @desc    Get comments
// @route   GET /api/v1/comments
// @access  Public
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const articleId = searchParams.get("articleId") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "createdAt";
    const order = (searchParams.get("order") as "asc" | "desc") || "desc";

    const result = await getCommentsService({
      articleId,
      userId,
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
    return handleApiError("Get comments failed!", error as string);
  }
};

// @desc    Create comment
// @route   POST /api/v1/comments
// @access  Private
export const POST = async (req: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "You must be signed in to create a comment",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { articleId, comment } = await req.json();

    if (!articleId || !comment) {
      return NextResponse.json(
        {
          success: false,
          message: "Article ID and comment are required",
        },
        { status: 400 }
      );
    }

    const serializedComment = await createCommentService(
      articleId,
      session.user.id,
      comment
    );

    return NextResponse.json(
      {
        success: true,
        data: serializedComment,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError("Create comment failed!", error as string);
  }
};
