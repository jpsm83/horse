import { NextResponse } from "next/server";

// imported utils
import { handleApiError } from "@/app/api/utils/handleApiError";
import { FieldProjectionType } from "@/app/api/utils/fieldProjections";
import { getArticleBySlugService } from "@/lib/services/articles";

// @desc    Get article by slug
// @route   GET /articles/[slug]
// @access  Public
export const GET = async (
  req: Request,
  context: { params: Promise<{ slug: string }> }
) => {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") || "en";
    const fields = (searchParams.get("fields") || "full") as FieldProjectionType;

    // ------------------------
    // Validate slug parameter
    // ------------------------
    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        {
          message: "Valid slug parameter is required!",
        },
        { status: 400 }
      );
    }

    // ------------------------
    // Validate fields parameter
    // ------------------------
    if (!["featured", "dashboard", "full"].includes(fields)) {
      return NextResponse.json(
        {
          message: "Invalid fields parameter. Must be 'featured', 'dashboard', or 'full'.",
        },
        { status: 400 }
      );
    }

    // ------------------------
    // Get article by slug using service
    // ------------------------
    const article = await getArticleBySlugService(slug, locale, fields);

    // ------------------------
    // Handle no results
    // ------------------------
    if (!article) {
      return NextResponse.json({ message: "Article not found!" }, { status: 404 });
    }

    return NextResponse.json(article, { status: 200 });
  } catch (error) {
    console.error("Error in route.ts:", error);
    return handleApiError("Get article by slug failed!", error as string);
  }
};
