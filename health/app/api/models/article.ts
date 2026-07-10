import { Schema, model, models } from "mongoose";
import { mainCategories, articleStatus } from "@/lib/constants";

// =========================
// LANGUAGE-SPECIFIC SCHEMAS
// =========================

// SEO schema - language specific
const seoSchema = new Schema({
  metaTitle: { type: String },
  metaDescription: {
    type: String,
    required: true,
    trim: true,
  },
  keywords: { type: [String] },
  slug: { type: String },
  hreflang: {
    type: String,
    required: true,
    enum: ["en", "pt", "es", "fr", "de", "it"], // Simplified locale list
  },
  canonicalUrl: {
    type: String,
    required: true,
  },
});

// Article content schema - language specific
const articleContentSchema = new Schema({
  mainTitle: { type: String },
  articleContents: [
    {
      subTitle: { type: String },
      articleParagraphs: { type: [String] },
    },
  ],
}); // must be at least 4 articles content

// =========================
// SOCIAL MEDIA SCHEMAS
// =========================

// Instagram
const instagramSchema = new Schema({
  caption: { type: String },
  hashtags: { type: String },
  altText: { type: String }, // accessibility text
});

// Facebook
const facebookSchema = new Schema({
  message: { type: String },
  headline: { type: String },
  linkDescription: { type: String }, // link preview text
  hashtags: { type: String }, // hashtags
  callToAction: { type: String }, // CTA button text (e.g., "Learn More")
});

// X (Twitter)
const xTwitterSchema = new Schema({
  text: { type: String },
  hashtags: { type: String },
});

// Pinterest
const pinterestSchema = new Schema({
  title: { type: String },
  description: { type: String },
  hashtags: { type: String },
  altText: { type: String }, // accessibility
});

// Threads
const threadsSchema = new Schema({
  text: { type: String },
  hashtags: { type: String },
});

// TikTok
const tiktokSchema = new Schema({
  title: { type: String },
  caption: { type: String },
  hashtags: { type: String },
});

// =========================
// UNIFIED LANGUAGE-SPECIFIC SCHEMA
// =========================

// This schema combines all language-specific components for better organization and maintainability
const languageSpecificSchema = new Schema({
  // Language identifier - single source of truth for language
  hreflang: {
    type: String,
    required: true,
    enum: ["en", "pt", "es", "fr", "de", "it"],
  },

  // Article context content (around 200 charecters)
  articleContext: { type: String },

  // image url to be used in the social media post
  postImage: { type: String },

  // Sales products information - array of strings
  salesProducts: { type: [String] },

  // SEO data specific to this language
  seo: { type: seoSchema },

  // Article content specific to this language
  content: { type: articleContentSchema },

  // Social media content specific to this language
  socialMedia: {
    instagram: instagramSchema,
    facebook: facebookSchema,
    xTwitter: xTwitterSchema,
    pinterest: pinterestSchema,
    threads: threadsSchema,
    tiktok: tiktokSchema,
  },
});

// =========================
// IMAGES CONTEXT SCHEMAS
// =========================

const imagesContextSchema = new Schema({
  imageOne: { type: String },
  imageTwo: { type: String },
  imageThree: { type: String },
  imageFour: { type: String },
});

// =========================
// ARTICLE MAIN SCHEMA
// =========================

export const articleSchema = new Schema(
  {
    // Unified language-specific content - all language-dependent data in one place
    languages: { type: [languageSpecificSchema] }, // en, pt, es, fr, de, it, must be done in each language

    // Article metadata - language independent
    category: {
      type: String,
      enum: mainCategories,
      required: true,
    },
    imagesContext: { type: imagesContextSchema },
    articleImages: {
      type: [String],
    }, // best if at least 4 images
    status: {
      type: String,
      enum: articleStatus,
      default: "published",
    },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: undefined,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    views: { type: Number, default: 0 },
    unpublishedAt: { type: Date, default: undefined },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    trim: true,
  }
);

// Add index for slug queries (not unique)
articleSchema.index({ "languages.seo.slug": 1 });

const Article = models.Article || model("Article", articleSchema);
export default Article;
