import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { checkAuthWithApiKey } from "@/lib/utils/apiKeyAuth";
import { ILanguageSpecific, IArticle } from "@/types/article";
import connectDb from "@/app/api/db/connectDb";
import { FieldProjectionType } from "@/app/api/utils/fieldProjections";
import Article from "@/app/api/models/article";
import { mainCategories } from "@/lib/constants";
import objDefaultValidation from "@/lib/utils/objDefaultValidation";
import uploadFilesCloudinary from "@/lib/cloudinary/uploadFilesCloudinary";
import deleteFolderCloudinary from "@/lib/cloudinary/deleteFolderCloudinary";
import isObjectIdValid from "@/app/api/utils/isObjectIdValid";
import { getArticleByIdService, updateArticleService, deleteArticleService } from "@/lib/services/articles";
import { validateCanonicalUrl } from "@/lib/utils/canonicalUrl";


// @desc    Get article by ID
// @route   GET /api/v1/articles/by-id/[articleId]
// @access  Public
export const GET = async (
  req: Request,
  context: { params: Promise<{ articleId: string }> }
) => {
  try {
    const { articleId } = await context.params;
    const { searchParams } = new URL(req.url);
    const fields = (searchParams.get("fields") || "full") as FieldProjectionType;

    if (!articleId) {
      return NextResponse.json(
        {
          message: "Article ID is required",
        },
        { status: 400 }
      );
    }

    // Validate articleId format
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return NextResponse.json(
        {
          message: "Invalid article ID format",
        },
        { status: 400 }
      );
    }

    // Validate fields parameter
    if (!["featured", "dashboard", "full"].includes(fields)) {
      return NextResponse.json(
        {
          message: "Invalid fields parameter. Must be 'featured', 'dashboard', or 'full'.",
        },
        { status: 400 }
      );
    }

    // Get article using service
    const article = await getArticleByIdService(articleId, fields);

    if (!article) {
      return NextResponse.json(
        {
          message: "Article not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Article retrieved successfully",
        article,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Get article by ID failed!", error as string);
  }
};

// @desc    Update article by ID
// @route   PATCH /api/v1/articles/by-id/[articleId]
// @access  Private (Author or Admin only, Session or API Key)
export const PATCH = async (
  req: Request,
  context: { params: Promise<{ articleId: string }> }
) => {
  try {
    // Validate session or API key
    const session = await auth();
    const authError = checkAuthWithApiKey(req, session);
    
    if (authError) {
      return authError;
    }

    const { articleId } = await context.params;

    if (!articleId) {
      return new NextResponse(
        JSON.stringify({
          message: "Article ID is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse FORM DATA instead of JSON because we might have image files
    const formData = await req.formData();

    // Extract article fields
    const category = formData.get("category") as string;
    const languagesRaw = formData.get("languages") as string;
    const imagesContextRaw = formData.get("imagesContext") as string;
    
    // Handle articleImages - can be File objects or URL strings
    // Method 1: Upload files (articleImageFiles field)
    // Method 2: Use pre-existing URLs (articleImages field)
    const articleImagesRaw = formData.get("articleImages") as string; // Pre-existing image URLs (JSON array)
    const fileEntries = formData
      .getAll("articleImageFiles")
      .filter((entry): entry is File => entry instanceof File);

    // Validate articleId format
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return NextResponse.json(
        {
          message: "Invalid article ID format",
        },
        { status: 400 }
      );
    }

    await connectDb();

    // Find the article (for authorization check)
    const existingArticle = await Article.findById(articleId).select("createdBy category articleImages");
    if (!existingArticle) {
      return NextResponse.json(
        {
          message: "Article not found",
        },
        { status: 404 }
      );
    }

    // Determine user ID and admin status
    let userId: string;
    let isAdmin: boolean;

    if (session) {
      userId = session.user.id;
      isAdmin = session.user.role === "admin";
    } else {
      // For API key authentication, use the hardcoded system user ID
      userId = "68e6a79afb1932c067f96e30";
      isAdmin = true; // API key users are treated as admin
    }

    // Check authorization - only author or admin can update
    if (existingArticle.createdBy.toString() !== userId && !isAdmin) {
      return NextResponse.json(
        {
          message: "You are not authorized to update this article",
        },
        { status: 403 }
      );
    }

    // Prepare update object
    const updateData: Partial<IArticle> = {};

    // Update category if provided
    if (category) {
      if (!mainCategories.includes(category)) {
        return NextResponse.json(
          {
            message: "Invalid category",
          },
          { status: 400 }
        );
      }
      updateData.category = category;
    }

    // Helper function to clean JSON string (remove markdown code blocks and fix common issues)
    const cleanJsonString = (jsonString: string): string => {
      let cleaned = jsonString.trim();
      
      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
      
      // Fix trailing commas in arrays and objects
      cleaned = cleaned.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
      
      // Normalize whitespace
      cleaned = cleaned.replace(/\s+/g, " ").trim();
      
      return cleaned;
    };

    // Update languages if provided
    if (languagesRaw) {
      try {
        const languages = JSON.parse(cleanJsonString(languagesRaw)) as ILanguageSpecific[];

        // Validate languages structure
        if (!Array.isArray(languages) || languages.length === 0) {
          return NextResponse.json(
            {
              message: "Languages must be a non-empty array",
            },
            { status: 400 }
          );
        }

        // Validate each language
        for (const language of languages) {
          // Validate articleContext - REQUIRED field
          if (
            language.articleContext === undefined ||
            typeof language.articleContext !== "string" ||
            language.articleContext.trim().length === 0
          ) {
            return NextResponse.json(
              {
                message: "ArticleContext is required and must be a non-empty string",
              },
              { status: 400 }
            );
          }

          // Validate postImage structure if provided
          if (language.postImage !== undefined) {
            if (
              typeof language.postImage !== "string" ||
              language.postImage.trim().length === 0
            ) {
              return NextResponse.json(
                {
                  message: "PostImage must be a non-empty string",
                },
                { status: 400 }
              );
            }
          }

          // Validate content structure
          if (
            !language.content ||
            !Array.isArray(language.content.articleContents) ||
            language.content.articleContents.length === 0
          ) {
            return NextResponse.json(
              {
                message: "Content.articleContents must be a non-empty array",
              },
              { status: 400 }
            );
          }

          // Validate each articleContent
          for (const articleContent of language.content.articleContents) {
            const articleContentValidation = objDefaultValidation(
              articleContent as unknown as {
                [key: string]: string | number | boolean | undefined;
              },
              {
                reqFields: ["subTitle", "articleParagraphs"],
                nonReqFields: [],
              }
            );

            if (articleContentValidation !== true) {
              return NextResponse.json(
                {
                  message: articleContentValidation,
                },
                { status: 400 }
              );
            }

            // Validate articleParagraphs
            if (
              !Array.isArray(articleContent.articleParagraphs) ||
              articleContent.articleParagraphs.length === 0
            ) {
              return NextResponse.json(
                {
                  message: "ArticleParagraphs must be a non-empty array",
                },
                { status: 400 }
              );
            }
          }

          // Validate SEO (no required fields)
          // Only validate hreflang enum if provided
          if (language.seo?.hreflang) {
            const supportedLocales = ["en", "pt", "es", "fr", "de", "it"];
            if (!supportedLocales.includes(language.seo.hreflang)) {
              return NextResponse.json(
                {
                  message: `Unsupported hreflang: ${language.seo.hreflang}. Supported values: ${supportedLocales.join(", ")}`,
                },
                { status: 400 }
              );
            }
          }

          // Ensure canonical URL is set and valid
          if (language.seo) {
            // Get locale from seo.hreflang or language.hreflang, default to "en"
            const hreflang = language.seo.hreflang || language.hreflang || "en";
            
            // Ensure slug exists
            if (!language.seo.slug) {
              return NextResponse.json(
                {
                  message: "SEO slug is required for canonical URL generation",
                },
                { status: 400 }
              );
            }

            // Use category from update or existing article
            const articleCategory = updateData.category || existingArticle.category;

            // Ensure slug exists
            if (!language.seo.slug) {
              return NextResponse.json(
                {
                  message: "SEO slug is required",
                },
                { status: 400 }
              );
            }

            // Canonical URL is REQUIRED when updating SEO (must be provided by n8n/OpenAI if updating)
            if (language.seo.canonicalUrl) {
              // Validate the canonical URL provided
              const validation = validateCanonicalUrl(
                language.seo.canonicalUrl,
                articleCategory,
                language.seo.slug,
                hreflang
              );

              if (!validation.isValid) {
                // Generate expected URL for error message
                const { generateCanonicalUrl } = await import("@/lib/utils/canonicalUrl");
                const expectedUrl = generateCanonicalUrl(articleCategory, language.seo.slug, hreflang);
                
                return NextResponse.json(
                  {
                    message: `Invalid canonical URL: ${validation.error}`,
                    details: `Expected format: ${expectedUrl}`,
                    received: language.seo.canonicalUrl,
                  },
                  { status: 400 }
                );
              }
            }
          }

          // Validate salesProducts field if provided (must be an array of strings)
          if (language.salesProducts !== undefined) {
            if (!Array.isArray(language.salesProducts)) {
              return NextResponse.json(
                {
                  message: "SalesProducts must be an array of strings",
                },
                { status: 400 }
              );
            }
            // Validate that all items in the array are strings
            if (!language.salesProducts.every((item) => typeof item === "string")) {
              return NextResponse.json(
                {
                  message: "All items in salesProducts array must be strings",
                },
                { status: 400 }
              );
            }
          }
        }

        updateData.languages = languages;
      } catch (error) {
        return NextResponse.json(
          {
            message: `Invalid languages format: ${error}`,
          },
          { status: 400 }
        );
      }
    }

    // Update imagesContext if provided
    if (imagesContextRaw) {
      try {
        const imagesContext = JSON.parse(cleanJsonString(imagesContextRaw));

        if (
          !imagesContext ||
          !imagesContext.imageOne ||
          !imagesContext.imageTwo ||
          !imagesContext.imageThree ||
          !imagesContext.imageFour
        ) {
          return NextResponse.json(
            {
              message:
                "ImagesContext must have imageOne, imageTwo, imageThree, and imageFour",
            },
            { status: 400 }
          );
        }
        updateData.imagesContext = imagesContext;
      } catch (error) {
        return NextResponse.json(
          {
            message: `Invalid imagesContext format: ${error}`,
          },
          { status: 400 }
        );
      }
    }

    // Handle image updates - either file uploads OR pre-existing URLs, not both
    const hasFileEntries = fileEntries.length > 0;
    const hasImageUrls = articleImagesRaw && articleImagesRaw.trim() !== "";
    
    if (hasFileEntries && hasImageUrls) {
      return NextResponse.json(
        {
          message: "Cannot use both file uploads and pre-existing URLs for images. Choose one method.",
        },
        { status: 400 }
      );
    }

    if (hasFileEntries) {
      // Handle file uploads
      const folder = `/${updateData.category || existingArticle.category}/${articleId}`;

      const cloudinaryUploadResponse = await uploadFilesCloudinary({
        folder,
        filesArr: fileEntries,
        onlyImages: true,
      });

      if (
        typeof cloudinaryUploadResponse === "string" ||
        cloudinaryUploadResponse.length === 0 ||
        !cloudinaryUploadResponse.every((str) => str.includes("https://"))
      ) {
        return NextResponse.json(
          {
            message: `Error uploading images: ${cloudinaryUploadResponse}`,
          },
          { status: 400 }
        );
      }

      // Add new images to existing ones
      updateData.articleImages = [
        ...(existingArticle.articleImages || []),
        ...cloudinaryUploadResponse,
      ];
    } else if (hasImageUrls) {
      try {
        const imageUrls = JSON.parse(articleImagesRaw);
        if (Array.isArray(imageUrls)) {
          // Handle existing URLs - replace all images
          updateData.articleImages = imageUrls;
        } else {
          return NextResponse.json(
            {
              message: "articleImages must be a JSON array of URLs",
            },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          {
            message: `Invalid articleImages format: ${error}`,
          },
          { status: 400 }
        );
      }
    }

    // Update the article using service
    const serializedArticle = await updateArticleService({
      articleId,
      updateData,
    });

    return NextResponse.json(
      {
        message: "Article updated successfully",
        article: serializedArticle,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Update article failed!", error as string);
  }
};

// @desc    Delete article by ID
// @route   DELETE /api/v1/articles/by-id/[articleId]
// @access  Private (Author or Admin only, Session or API Key)
export const DELETE = async (
  req: Request,
  context: { params: Promise<{ articleId: string }> }
) => {
  try {
    // Validate session or API key
    const session = await auth();
    const authError = checkAuthWithApiKey(req, session);
    
    if (authError) {
      return authError;
    }

    const { articleId } = await context.params;

    if (!articleId) {
      return new NextResponse(
        JSON.stringify({
          message: "Article ID is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate articleId format
    if (!isObjectIdValid([articleId])) {
      return NextResponse.json(
        {
          message: "Invalid article ID format!",
        },
        { status: 400 }
      );
    }

    // Determine user ID and admin status
    let isAdmin: boolean;

    if (session) {
      isAdmin = session.user.role === "admin";
    } else {
      // For API key authentication, treat as admin
      isAdmin = true;
    }

    await connectDb();

    // Find the article (for authorization check only - we don't need articleImages anymore)
    const article = await Article.findById(articleId).select("_id");

    if (!article) {
      return NextResponse.json(
        {
          message: "Article not found!",
        },
        { status: 404 }
      );
    }

    // Check authorization - only admin can delete
    if (!isAdmin) {
      return NextResponse.json(
        {
          message: "You are not authorized to delete this article! Only administrators can delete articles.",
        },
        { status: 403 }
      );
    }

    // Delete entire folder from Cloudinary (before DB deletion)
    // CRITICAL: Path is exactly "health/articles/{articleId}" - articleId is validated as ObjectId above
    // This ensures we only delete the specific article's folder and nothing else
    try {
      // Construct the exact folder path - articleId is already validated as ObjectId
      const folderPath = `health/articles/${articleId}`;
      
      // Delete the entire folder (all files and the folder itself)
      await deleteFolderCloudinary(folderPath);
    } catch (error) {
      console.warn(`Failed to delete folder from Cloudinary: health/articles/${articleId}`, error);
      // Continue with article deletion even if folder deletion fails
      // This prevents a Cloudinary error from blocking database cleanup
    }

    // Delete the article using service (includes comment deletion)
    // CRITICAL: findByIdAndDelete only deletes the document with the exact ID
    // Comment.deleteMany only deletes comments with the exact articleId
    await deleteArticleService(articleId);

    return NextResponse.json(
      {
        message: "Article deleted successfully!",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Delete article failed!", error as string);
  }
};