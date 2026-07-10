import { NextResponse } from "next/server";

// imported utils
import { handleApiError } from "@/app/api/utils/handleApiError";
import { FieldProjectionType } from "@/app/api/utils/fieldProjections";
import { getArticlesPaginatedService } from "@/lib/services/articles";

// @desc    Get paginated articles with advanced features
// @route   GET /articles/paginated
// @access  Public
export const GET = async (req: Request) => {
  try {
    // ------------------------
    // Parse query parameters
    // ------------------------
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "9");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const slug = searchParams.get("slug") || undefined;
    const category = searchParams.get("category") || undefined;
    const locale = searchParams.get("locale") || "en";
    const excludeIds = searchParams.get("excludeIds") || undefined;
    const query = searchParams.get("query") || undefined;
    const fields = (searchParams.get("fields") || "full") as FieldProjectionType;
    const skipCount = searchParams.get("skipCount") === "true";

    // ------------------------
    // Validate excludeIds format
    // ------------------------
    let excludeIdsArray: string[] | undefined;
    if (excludeIds) {
      try {
        excludeIdsArray = JSON.parse(excludeIds);
        if (!Array.isArray(excludeIdsArray) || excludeIdsArray.length === 0) {
          return NextResponse.json(
            {
              message:
                "Invalid excludeIds format. Must be a JSON array of ObjectIds.",
            },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          {
            message:
              "Invalid excludeIds format. Must be a JSON array of ObjectIds.",
          },
          { status: 400 }
        );
      }
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
    // Validate required parameters
    // ------------------------
    if (!query && !category) {
      return NextResponse.json(
        {
          message: "Either 'query' or 'category' parameter is required for paginated articles endpoint.",
        },
        { status: 400 }
      );
    }

    // ------------------------
    // Build filter
    // ------------------------
    if (category && slug) {
      return NextResponse.json(
        {
          message: "Category and slug are not allowed together!",
        },
        { status: 400 }
      );
    }

    const result = await getArticlesPaginatedService({
      page,
      limit,
      sort,
      order,
      locale,
      category: category || undefined,
      slug,
      query: query || undefined,
      excludeIds: excludeIdsArray,
      skipCount,
      fields,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching paginated articles:", error);
    return handleApiError("Get paginated articles failed!", error as string);
  }
};
