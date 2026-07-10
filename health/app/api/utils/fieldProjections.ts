// Field projection definitions for MongoDB queries
// These projections limit the fields returned to improve performance

export const fieldProjections = {
  // Minimal fields for featured articles (ArticleCard component)
  // Used in: Home page, Category carousels, Featured sections
  featured: {
    category: 1,
    articleImages: 1,
    updatedAt: 1,
    createdAt: 1,
    "languages.hreflang": 1,
    "languages.content.mainTitle": 1,
    "languages.content.articleContents": 1, // Needed for readTime & excerpt calculation
    "languages.seo.slug": 1,
  },
  
  // Dashboard fields (stats + basic info)
  // Used in: Admin dashboard
  dashboard: {
    _id: 1,
    category: 1,
    createdAt: 1,
    updatedAt: 1,
    likes: 1,
    commentsCount: 1,
    views: 1,
    "languages.content.mainTitle": 1,
    "languages.seo.slug": 1,
  },
  
  // Full article (default, all fields)
  // Used in: Article detail pages, full article views
  full: {}, // Empty object = all fields
};

export type FieldProjectionType = "featured" | "dashboard" | "full";

