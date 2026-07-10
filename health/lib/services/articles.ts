import connectDb from "@/app/api/db/connectDb";
import Article from "@/app/api/models/article";
import User from "@/app/api/models/user";
import Comment from "@/app/api/models/comment";
import mongoose from "mongoose";
import { unstable_cache } from "next/cache";
import {
  fieldProjections,
  FieldProjectionType,
} from "@/app/api/utils/fieldProjections";
import {
  IArticleLean,
  ILanguageSpecific,
  IGetArticlesParams,
  ISerializedArticle,
  serializeMongoObject,
  IArticle,
} from "@/types/article";
import { IMongoFilter, IPaginatedResponse } from "@/types/api";

export interface GetArticlesServiceParams extends IGetArticlesParams {
  skipCount?: boolean;
  fields?: FieldProjectionType;
}

const DEFAULT_LOCALE = "en";

const buildFilter = ({
  slug,
  category,
  excludeIds,
  query,
}: GetArticlesServiceParams): IMongoFilter => {
  const filter: IMongoFilter = {};

  if (slug) {
    filter["languages.seo.slug"] = slug;
  }

  if (category) {
    filter.category = category;
  }

  if (query && query.trim()) {
    filter["languages"] = {
      $elemMatch: {
        "content.mainTitle": { $regex: query.trim(), $options: "i" },
      },
    };
  }

  if (excludeIds && excludeIds.length > 0) {
    filter._id = { $nin: excludeIds };
  }

  return filter;
};

const selectLanguage = (
  article: IArticleLean,
  locale: string,
  slug?: string
): ILanguageSpecific | undefined => {
  if (slug) {
    return article.languages.find((language) => language.seo.slug === slug);
  }

  const byLocale = article.languages.find(
    (language) => language.hreflang === locale
  );

  if (byLocale) {
    return byLocale;
  }

  if (locale !== DEFAULT_LOCALE) {
    const english = article.languages.find(
      (language) => language.hreflang === DEFAULT_LOCALE
    );

    if (english) {
      return english;
    }
  }

  return article.languages[0];
};

export const applyLocaleFilter = (
  articles: IArticleLean[],
  locale: string,
  slug?: string
): IArticleLean[] => {
  return articles
    .map((article) => {
      const language = selectLanguage(article, locale, slug);

      if (!language) {
        return null;
      }

      return {
        ...article,
        languages: [language],
      };
    })
    .filter((article): article is IArticleLean => Boolean(article));
};

export async function getArticlesService(
  params: GetArticlesServiceParams = {}
): Promise<IPaginatedResponse<ISerializedArticle>> {
  const {
    page = 1,
    limit = 9,
    sort = "createdAt",
    order = "desc",
    locale = DEFAULT_LOCALE,
    slug,
    skipCount = false,
    fields = "full",
    random = false,
  } = params;

  if (!random && !["asc", "desc"].includes(order)) {
    throw new Error("Invalid order parameter. Use 'asc' or 'desc'.");
  }

  const filter = buildFilter(params);
  const projection = fieldProjections[fields] || {};

  await connectDb();

  if (random) {
    const sampled = await Article.aggregate([
      { $match: filter },
      { $sample: { size: limit } },
      { $project: { _id: 1 } },
    ]);
    const ids = sampled.map((d) => d._id);
    if (ids.length === 0) {
      return {
        page,
        limit,
        totalDocs: skipCount ? 0 : 0,
        totalPages: skipCount ? 0 : 0,
        data: [],
      };
    }
    const rawArticles = (await Article.find(
      { _id: { $in: ids } },
      projection
    )
      .populate({ path: "createdBy", select: "username" })
      .lean()) as IArticleLean[];
    const orderMap = new Map(
      ids.map((id, i) => [id.toString(), i])
    );
    rawArticles.sort(
      (a, b) =>
        (orderMap.get(a._id?.toString() ?? "") ?? 0) -
        (orderMap.get(b._id?.toString() ?? "") ?? 0)
    );
    const filteredArticles = applyLocaleFilter(rawArticles, locale, slug);
    const totalDocs = skipCount ? 0 : await Article.countDocuments(filter);
    const totalPages = skipCount ? 0 : Math.ceil(totalDocs / Math.max(limit, 1));
    return {
      page,
      limit,
      totalDocs,
      totalPages,
      data: filteredArticles.map(
        (article) => serializeMongoObject(article) as ISerializedArticle
      ),
    };
  }

  const articles = (await Article.find(filter, projection)
    .populate({ path: "createdBy", select: "username" })
    .sort({ [sort]: order === "asc" ? 1 : -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean()) as IArticleLean[];

  if (!articles.length) {
    return {
      page,
      limit,
      totalDocs: skipCount ? 0 : 0,
      totalPages: skipCount ? 0 : 0,
      data: [],
    };
  }

  const filteredArticles = applyLocaleFilter(articles, locale, slug);

  const totalDocs = skipCount ? 0 : await Article.countDocuments(filter);
  const totalPages = skipCount ? 0 : Math.ceil(totalDocs / Math.max(limit, 1));

  return {
    page,
    limit,
    totalDocs,
    totalPages,
    data: filteredArticles.map(
      (article) => serializeMongoObject(article) as ISerializedArticle
    ),
  };
}

export async function getArticlesPaginatedService(
  params: GetArticlesServiceParams & { query?: string } = {}
): Promise<IPaginatedResponse<ISerializedArticle>> {
  const {
    page = 1,
    limit = 9,
    sort = "createdAt",
    order = "desc",
    locale = DEFAULT_LOCALE,
    slug,
    category,
    query,
    skipCount = false,
    fields = "full",
    random = false,
  } = params;

  const useRandomFirstPage = Boolean(random && page === 1 && category);
  if (!useRandomFirstPage && !["asc", "desc"].includes(order)) {
    throw new Error("Invalid order parameter. Use 'asc' or 'desc'.");
  }

  if (!query && !category) {
    throw new Error(
      "Either 'query' or 'category' parameter is required for paginated articles endpoint."
    );
  }

  const filter = buildFilter({ ...params, query });
  const projection = fieldProjections[fields] || {};

  await connectDb();

  const isSearchQuery = query && query.trim();

  let articles: IArticleLean[];
  let totalDocs: number;
  let totalPages: number;

  if (isSearchQuery) {
    // For search: fetch all, filter by locale, then paginate in memory
    const allFilteredArticles = (await Article.find(filter, projection)
      .populate({ path: "createdBy", select: "username" })
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .lean()) as IArticleLean[];

    const allArticlesWithLocaleFilter = applyLocaleFilter(
      allFilteredArticles,
      locale,
      slug
    );

    // Apply pagination to the locale-filtered results
    const skip = (page - 1) * limit;
    articles = allArticlesWithLocaleFilter.slice(skip, skip + limit);

    // Count after locale filtering for search
    totalDocs = skipCount ? 0 : allArticlesWithLocaleFilter.length;
    totalPages = skipCount ? 0 : Math.ceil(totalDocs / limit);
  } else {
    // For category: random first page or database-level pagination
    if (useRandomFirstPage) {
      const sampled = await Article.aggregate([
        { $match: filter },
        { $sample: { size: limit } },
        { $project: { _id: 1 } },
      ]);
      const ids = sampled.map((d) => d._id);
      if (ids.length === 0) {
        const total = skipCount ? 0 : await Article.countDocuments(filter);
        return {
          page,
          limit,
          totalDocs: total,
          totalPages: skipCount ? 0 : Math.ceil(total / limit),
          data: [],
        };
      } else {
        const rawArticles = (await Article.find(
          { _id: { $in: ids } },
          projection
        )
          .populate({ path: "createdBy", select: "username" })
          .lean()) as IArticleLean[];
        const orderMap = new Map(
          ids.map((id, i) => [id.toString(), i])
        );
        rawArticles.sort(
          (a, b) =>
            (orderMap.get(a._id?.toString() ?? "") ?? 0) -
            (orderMap.get(b._id?.toString() ?? "") ?? 0)
        );
        articles = applyLocaleFilter(rawArticles, locale, slug);
        totalDocs = skipCount ? 0 : await Article.countDocuments(filter);
        totalPages = skipCount ? 0 : Math.ceil(totalDocs / limit);
      }
    } else {
      const skip = (page - 1) * limit;
      const rawArticles = (await Article.find(filter, projection)
        .populate({ path: "createdBy", select: "username" })
        .sort({ [sort]: order === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean()) as IArticleLean[];

      articles = applyLocaleFilter(rawArticles, locale, slug);
      totalDocs = skipCount ? 0 : await Article.countDocuments(filter);
      totalPages = skipCount ? 0 : Math.ceil(totalDocs / limit);
    }
  }

  if (!articles || articles.length === 0) {
    return {
      page,
      limit,
      totalDocs: 0,
      totalPages: 0,
      data: [],
    };
  }

  return {
    page,
    limit,
    totalDocs,
    totalPages,
    data: articles.map(
      (article) => serializeMongoObject(article) as ISerializedArticle
    ),
  };
}

export async function getArticleBySlugService(
  slug: string,
  locale: string = DEFAULT_LOCALE,
  fields: FieldProjectionType = "full"
): Promise<ISerializedArticle | null> {
  if (!slug || typeof slug !== "string") {
    throw new Error("Valid slug parameter is required!");
  }

  await connectDb();

  const projection = fieldProjections[fields] || {};

  const article = (await Article.findOne(
    { "languages.seo.slug": slug },
    projection
  )
    .populate({ path: "createdBy", select: "username", model: User })
    .lean()) as IArticleLean | null;

  if (!article || !article.languages?.length) {
    return null;
  }

  const languages = article.languages as ILanguageSpecific[];
  let languageSpecific = languages.find((lang) => lang.seo?.slug === slug);

  if (!languageSpecific) {
    languageSpecific = languages.find((lang) => lang.hreflang === locale);
  }

  if (!languageSpecific && locale !== DEFAULT_LOCALE) {
    languageSpecific = languages.find(
      (lang) => lang.hreflang === DEFAULT_LOCALE
    );
  }

  if (!languageSpecific) {
    languageSpecific = languages[0];
  }

  if (!languageSpecific) {
    return null;
  }

  return serializeMongoObject({
    ...article,
    languages: [languageSpecific],
  }) as ISerializedArticle;
}

export async function getArticleByIdService(
  articleId: string,
  fields: FieldProjectionType = "full"
): Promise<ISerializedArticle | null> {
  if (!articleId) {
    throw new Error("Article ID is required");
  }

  await connectDb();

  const projection = fieldProjections[fields] || {};

  const article = (await Article.findById(articleId, projection)
    .populate({ path: "createdBy", select: "username", model: User })
    .lean()) as IArticleLean | null;

  if (!article) {
    return null;
  }

  return serializeMongoObject(article) as ISerializedArticle;
}

export async function getAllArticlesForDashboardService(): Promise<
  ISerializedArticle[]
> {
  await connectDb();

  const articles = (await Article.find({}, fieldProjections.dashboard)
    .populate({ path: "createdBy", select: "username" })
    .sort({ createdAt: -1 })
    .lean()) as IArticleLean[];

  return articles.map(
    (article) => serializeMongoObject(article) as ISerializedArticle
  );
}

export interface ArticleStats {
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

export async function getArticleStatsService(): Promise<ArticleStats> {
  await connectDb();

  const totalArticles = await Article.countDocuments({});

  const allArticles = await Article.find({}).select(
    "views likes commentsCount"
  );

  const totalViews = allArticles.reduce(
    (sum, article) => sum + (article.views || 0),
    0
  );
  const totalLikes = allArticles.reduce(
    (sum, article) => sum + (article.likes?.length || 0),
    0
  );
  const totalComments = allArticles.reduce(
    (sum, article) => sum + (article.commentsCount || 0),
    0
  );

  return {
    totalArticles,
    totalViews,
    totalLikes,
    totalComments,
  };
}

export async function getArticlesCountService(
  params: { category?: string; locale?: string } = {}
): Promise<number> {
  const { category, locale = DEFAULT_LOCALE } = params;

  // Use Next.js cache for expensive count operations
  const getCachedCount = unstable_cache(
    async () => {
      const filter: IMongoFilter = {};

      if (category) {
        filter.category = category;
      }

      await connectDb();

      // Use countDocuments for better performance (approximation for locale filtering)
      // This is much faster than fetching all articles
      // Note: This is an approximation since locale filtering happens post-fetch
      // For exact counts, use getArticlesPaginatedService with skipCount: false
      const count = await Article.countDocuments(filter);

      return count;
    },
    [`articles-count-${category || "all"}-${locale}`],
    {
      revalidate: 3600, // Cache for 1 hour (matches page revalidate)
      tags: [`articles-count-${category || "all"}-${locale}`],
    }
  );

  return await getCachedCount();
}

export async function incrementArticleViewsService(
  articleId: string
): Promise<number> {
  if (!articleId) {
    throw new Error("Article ID is required");
  }

  await connectDb();

  const updatedArticle = await Article.findByIdAndUpdate(
    articleId,
    { $inc: { views: 1 } },
    { new: true, select: "views" }
  );

  if (!updatedArticle) {
    throw new Error("Article not found");
  }

  return updatedArticle.views || 0;
}

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

export async function toggleArticleLikeService(
  articleId: string,
  userId: string
): Promise<ToggleLikeResult> {
  if (!articleId) {
    throw new Error("Article ID is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  await connectDb();

  const article = await Article.findById(articleId);

  if (!article) {
    throw new Error("Article not found");
  }

  const userLiked = article.likes?.includes(userId);

  // Toggle like status using atomic operation
  const updatedArticle = await Article.findByIdAndUpdate(
    articleId,
    userLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
    { new: true }
  );

  if (!updatedArticle) {
    throw new Error("Failed to update article like");
  }

  // Update user's likedArticles array
  await User.findByIdAndUpdate(
    userId,
    userLiked
      ? { $pull: { likedArticles: articleId } }
      : { $addToSet: { likedArticles: articleId } },
    { new: true }
  );

  return {
    liked: !userLiked,
    likeCount: updatedArticle.likes?.length || 0,
  };
}

export interface ArticleLikeStatus {
  likeCount: number;
  userLiked: boolean;
}

export async function getArticleLikeStatusService(
  articleId: string,
  userId?: string
): Promise<ArticleLikeStatus> {
  if (!articleId) {
    throw new Error("Article ID is required");
  }

  await connectDb();

  const article = await Article.findById(articleId).select("likes");

  if (!article) {
    throw new Error("Article not found");
  }

  const likeCount = article.likes?.length || 0;
  const userLiked = userId ? article.likes?.includes(userId) : false;

  return {
    likeCount,
    userLiked,
  };
}

export interface UpdateArticleServiceParams {
  articleId: string;
  updateData: Partial<IArticle>;
}

export async function updateArticleService(
  params: UpdateArticleServiceParams
): Promise<ISerializedArticle> {
  const { articleId, updateData } = params;

  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    throw new Error("Invalid article ID format");
  }

  await connectDb();

  const updatedArticle = await Article.findByIdAndUpdate(
    articleId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedArticle) {
    throw new Error("Article not found or failed to update");
  }

  return serializeMongoObject(updatedArticle.toObject()) as ISerializedArticle;
}

export async function deleteArticleService(articleId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    throw new Error("Invalid article ID format");
  }

  await connectDb();

  const article = await Article.findById(articleId);

  if (!article) {
    throw new Error("Article not found");
  }

  // Delete associated comments
  await Comment.deleteMany({ articleId: articleId });

  // Delete the article
  await Article.findByIdAndDelete(articleId);
}
