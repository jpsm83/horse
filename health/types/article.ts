import { Types, Document } from "mongoose";
import { mainCategories, articleStatus } from "@/lib/constants";

export interface IGetArticlesParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  locale?: string;
  category?: string;
  slug?: string;
  query?: string;
  excludeIds?: string[];
  random?: boolean;
}

export interface IArticleCardProps {
  author: string;
  category: string;
  excerpt: string;
  id: string;
  imageUrl: string;
  publishedAt: string;
  readTime: string;
  slug: string;
  title: string;
}

export interface ISeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  slug?: string;
  hreflang?: string;
  canonicalUrl?: string;
}

export interface IMetaDataArticle {
  slug: string;
  createdBy: string;
  articleImages?: string[];
  category: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  seo: ISeo;
  postImage?: string; // Single postImage for all social media platforms
  socialMedia?: ISocialMedia;
}

export interface IArticleContent {
  subTitle: string;
  articleParagraphs: string[];
}

// Article context interface - single string field
export interface IArticleContext {
  articleContext: string;
}

// Social media interfaces
export interface IInstagram {
  caption: string;
  hashtags: string;
  altText?: string;
}

export interface IFacebook {
  message: string;
  headline: string;
  linkDescription: string;
  hashtags: string;
  callToAction?: string;
}

export interface IXTwitter {
  text: string;
  hashtags: string;
}

export interface IPinterest {
  title: string;
  description: string;
  hashtags: string;
  altText: string;
}

export interface IYouTube {
  title: string;
  description: string;
  tags: string[];
}

export interface IThreads {
  text: string;
  hashtags: string;
}

export interface ITikTok {
  title: string;
  caption: string;
  hashtags: string;
}

export interface ISocialMedia {
  instagram?: IInstagram;
  facebook?: IFacebook;
  xTwitter?: IXTwitter;
  pinterest?: IPinterest;
  youtube?: IYouTube;
  threads?: IThreads;
  tiktok?: ITikTok;
}

// New unified language-specific interface
export interface ILanguageSpecific {
  hreflang: string;
  articleContext: string;
  postImage: string; // Single postImage for all social media platforms
  salesProducts?: string[]; // Sales products information - array of strings
  seo: ISeo;
  content: {
    mainTitle: string;
    articleContents: IArticleContent[];
  };
  socialMedia?: ISocialMedia;
}

// Legacy interface for backward compatibility during migration
export interface IContentsByLanguage {
  mainTitle: string;
  articleContents: IArticleContent[];
  seo: ISeo; // hreflang contains language/locale info
}

// Comment interfaces moved to interfaces/comment.ts

// Images context interface
export interface IImagesContext {
  imageOne: string;
  imageTwo: string;
  imageThree: string;
  imageFour: string;
}

export interface IArticle {
  _id?: Types.ObjectId;
  languages: ILanguageSpecific[];
  category: (typeof mainCategories)[number];
  imagesContext: IImagesContext;
  articleImages: string[];
  status?: (typeof articleStatus)[number];
  likes?: Types.ObjectId[];
  commentsCount?: number;
  views?: number;
  unpublishedAt?: Date;
  createdBy: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

// MongoDB Document type for Article
export interface IArticleDocument extends Document {
  _id: Types.ObjectId;
  languages: ILanguageSpecific[];
  category: (typeof mainCategories)[number];
  imagesContext: IImagesContext;
  articleImages: string[];
  status?: (typeof articleStatus)[number];
  likes?: Types.ObjectId[];
  commentsCount: number;
  views?: number;
  unpublishedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

// Lean Article type (for .lean() queries)
export interface IArticleLean {
  _id: Types.ObjectId;
  languages: ILanguageSpecific[];
  category: (typeof mainCategories)[number];
  imagesContext: IImagesContext;
  articleImages: string[];
  status?: (typeof articleStatus)[number];
  likes?: Types.ObjectId[];
  commentsCount: number;
  views?: number;
  unpublishedAt?: Date;
  createdBy: Types.ObjectId | { _id: Types.ObjectId; username: string };
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

// Serialized Article type (for API responses)
export interface ISerializedArticle {
  _id: string;
  languages: ILanguageSpecific[];
  category: (typeof mainCategories)[number];
  imagesContext: IImagesContext;
  articleImages: string[];
  status?: (typeof articleStatus)[number];
  likes?: string[];
  commentsCount: number;
  views?: number;
  unpublishedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Comment interfaces moved to interfaces/comment.ts

// Utility function to serialize MongoDB objects
export const serializeMongoObject = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(serializeMongoObject);
  }
  if (typeof obj === 'object' && obj !== null && obj.constructor && obj.constructor.name === 'ObjectId') {
    return obj.toString();
  }
  if (typeof obj === 'object' && obj !== null && obj.constructor && obj.constructor.name === 'Date') {
    return (obj as Date).toISOString();
  }
  if (typeof obj === 'object' && obj !== null) {
    const serialized: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as Record<string, unknown>)[key];
        
        // Handle populated Mongoose fields: if it's an object with _id, extract the _id
        // This handles cases like createdBy: { _id: ObjectId, username: "..." }
        // which should be serialized to just the _id string for ISerializedArticle
        if (
          key === 'createdBy' && 
          value && 
          typeof value === 'object' && 
          '_id' in value
        ) {
          const populatedField = value as { _id: unknown };
          serialized[key] = typeof populatedField._id === 'string' 
            ? populatedField._id 
            : (populatedField._id as { toString: () => string }).toString();
        } else {
          serialized[key] = serializeMongoObject(value);
        }
      }
    }
    return serialized;
  }
  return obj;
};
