# Server Actions Architecture

This document explains the comprehensive Next.js 15 architecture with a service-oriented design where all database logic is centralized in services, used by both server actions and API routes.

## Overview

The architecture follows this pattern:
1. **Service Layer** (`lib/services/`) - Centralized database operations and business logic
2. **Server Actions** (`app/actions/`) - Thin wrappers that call services or routes
3. **API Routes** (`app/api/v1/`) - Thin wrappers that call services, handle HTTP concerns
4. **Server Components** - Can directly import and use server actions or services
5. **Client Components** - Receive serialized data from server components

## Architecture Pattern

```
┌─────────────────┐
│ Server Component│
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌────────────────┐  ┌──────────────┐
│ Server Action  │  │  API Route   │
└────────┬───────┘  └──────┬───────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Service Layer   │
         │ (lib/services/)  │
         └────────┬─────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   Database      │
         │   (MongoDB)     │
         └─────────────────┘
```

### Key Principles

1. **Single Source of Truth**: Services contain all DB logic
2. **No `internalFetch`**: Direct service calls (no server-side HTTP hops)
3. **Separation of Concerns**: 
   - Services = DB operations
   - Routes = HTTP handling, file uploads, email sending
   - Actions = Thin bridges to services or routes

## Service Layer Structure

All business logic lives in `lib/services/`:

```
lib/services/
├── articles.ts      # Article CRUD, likes, views, stats
├── comments.ts      # Comment CRUD, likes, reports
├── users.ts         # User CRUD, liked articles
├── subscribers.ts  # Subscriber CRUD, subscribe/unsubscribe
├── newsletter.ts    # Newsletter operations
├── auth.ts          # Email confirmation, password reset
├── upload.ts        # Image upload, Cloudinary operations
└── README.md        # Service layer guidelines
```

### Server Actions Structure
```
app/actions/
├── article/
│   ├── getArticles.ts                    # General article fetching
│   ├── getArticleBySlug.ts              # Single article by slug
│   ├── getArticlesByCategory.ts         # Category articles (non-paginated)
│   ├── getArticlesByCategoryPaginated.ts # Category articles (paginated)
│   ├── searchArticlesPaginated.ts       # Search with pagination
│   └── toggleArticleLike.ts             # Article like functionality
├── auth/
│   ├── confirmEmail.ts                  # Email confirmation logic
│   ├── requestEmailConfirmation.ts      # Email confirmation request logic
│   ├── requestPasswordReset.ts          # Password reset request logic
│   └── resetPassword.ts                 # Password reset logic
├── newsletter/
│   └── sendNewsletter.ts                # Newsletter sending logic
├── subscribers/
│   ├── newsletterSubscribe.ts           # Newsletter subscription logic
│   ├── newsletterUnsubscribe.ts         # Newsletter unsubscription logic
│   └── confirmNewsletterSubscription.ts # Newsletter confirmation logic
├── user/
│   └── commentReport.ts                 # Comment report email logic
└── comment/
    ├── commentLikes.ts                  # Comment likes functionality
    ├── commentReports.ts                # Comment reports functionality
    └── comments.ts                      # Comment management
```

### API Routes Structure
```
app/api/v1/
├── articles/
│   ├── route.ts                     # Main articles endpoint
│   ├── paginated/route.ts          # Dedicated pagination endpoint
│   ├── by-id/
│   │   └── [articleId]/
│   │       └── likes/
│   │           └── route.ts         # Article likes endpoint
│   └── by-slug/
│       └── [slug]/
│           └── route.ts             # Single article by slug endpoint
├── auth/
│   ├── [...nextauth]/route.ts       # NextAuth.js authentication
│   ├── confirm-email/route.ts       # Email confirmation endpoint
│   ├── request-email-confirmation/route.ts # Request email confirmation
│   ├── request-password-reset/route.ts     # Request password reset
│   └── reset-password/route.ts             # Reset password endpoint
├── newsletter/
│   └── send-newsletter/route.ts     # Send newsletter endpoint
├── subscribers/
│   ├── route.ts                     # Subscriber management
│   ├── [subscriberId]/route.ts      # Individual subscriber management
│   ├── newsletter-subscribe/route.ts        # Newsletter subscription
│   ├── newsletter-unsubscribe/route.ts      # Newsletter unsubscription
│   └── confirm-newsletter-subscription/route.ts # Newsletter confirmation
└── users/
    ├── route.ts                     # User management
    ├── [userId]/route.ts            # Individual user management
    └── comment-report/route.ts      # Comment report notification
```

## Complete API Endpoints Reference

### Articles Endpoints
| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/v1/articles` | GET | Main articles with smart routing | `page`, `limit`, `sort`, `order`, `locale`, `category`, `query` |
| `/api/v1/articles/paginated` | GET | Dedicated paginated articles | `page`, `limit`, `sort`, `order`, `locale`, `category`, `query` |
| `/api/v1/articles/by-slug/[slug]` | GET | Single article by slug | `slug` (URL param) |
| `/api/v1/articles/by-id/[articleId]/likes` | POST/GET | Article likes management | `articleId` (URL param) |

### Authentication Endpoints
| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/v1/auth/[...nextauth]` | GET/POST | NextAuth.js authentication | Various auth parameters |
| `/api/v1/auth/confirm-email` | POST | Confirm email with token | `token` |
| `/api/v1/auth/request-email-confirmation` | POST | Request email confirmation | `email` |
| `/api/v1/auth/request-password-reset` | POST | Request password reset | `email` |
| `/api/v1/auth/reset-password` | POST | Reset password with token | `token`, `newPassword` |

### Newsletter Endpoints
| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/v1/newsletter/send-newsletter` | POST | Send newsletter to all subscribers | None |

### Subscriber Endpoints
| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/v1/subscribers` | GET/POST | Subscriber management | Various subscriber parameters |
| `/api/v1/subscribers/[subscriberId]` | GET/PUT/DELETE | Individual subscriber management | `subscriberId` (URL param) |
| `/api/v1/subscribers/newsletter-subscribe` | POST | Subscribe to newsletter | `email`, `preferences` |
| `/api/v1/subscribers/newsletter-unsubscribe` | POST | Unsubscribe from newsletter | `email`, `token` |
| `/api/v1/subscribers/confirm-newsletter-subscription` | POST | Confirm newsletter subscription | `token`, `email` |

### User Endpoints
| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/v1/users` | GET/POST | User management | Various user parameters |
| `/api/v1/users/[userId]` | GET/PUT/DELETE | Individual user management | `userId` (URL param) |
| `/api/v1/users/comment-report` | POST | Send comment report notification | `email`, `username`, `commentText`, `reason`, `articleTitle`, `locale` |

## API Summary

### Total Endpoints: **18 API Routes**
- **Articles**: 4 endpoints (main, paginated, by-slug, likes)
- **Authentication**: 5 endpoints (NextAuth + 4 email-related)
- **Newsletter**: 1 endpoint (send newsletter)
- **Subscribers**: 5 endpoints (management + subscription flows)
- **Users**: 3 endpoints (management + comment reports)

### Organization Principles
1. **RESTful Design**: Clear resource-based URLs
2. **Nested Resources**: Related endpoints grouped logically
3. **Dynamic Routes**: `[param]` for resource-specific operations
4. **Consistent Naming**: Clear, descriptive endpoint names
5. **HTTP Methods**: Appropriate use of GET, POST, PUT, DELETE

## Benefits

- **DRY Principle**: Database logic is written once and reused
- **Type Safety**: Shared interfaces ensure consistency
- **Maintainability**: Changes to database logic only need to be made in one place
- **Flexibility**: Same logic works for both internal and external API access
- **Performance**: Optimized queries and serialization
- **Scalability**: Handles both small and large datasets efficiently
- **Consistency**: Uniform response format across all endpoints
- **Organization**: Actions grouped by functionality for better maintainability
- **Clarity**: Clear separation of concerns between different system domains

## Implementation Examples

### 1. General Article Fetching

#### Service (`lib/services/articles.ts`)
```typescript
export async function getArticlesService(
  params: GetArticlesServiceParams = {}
): Promise<IPaginatedResponse<ISerializedArticle>> {
  const { page = 1, limit = 9, locale = "en", ...filters } = params;
  
  await connectDb();
  
  const filter = buildFilter(filters);
  const projection = fieldProjections[fields] || {};
  
  const articles = await Article.find(filter, projection)
    .populate({ path: "createdBy", select: "username" })
    .sort({ [sort]: order === "asc" ? 1 : -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean() as IArticleLean[];
  
  const filteredArticles = applyLocaleFilter(articles, locale);
  
  const totalDocs = await Article.countDocuments(filter);
  
  return {
    page,
    limit,
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    data: filteredArticles.map(serializeMongoObject) as ISerializedArticle[],
  };
}
```

#### Server Action (`app/actions/article/getArticles.ts`)
```typescript
"use server";

import { getArticlesService } from "@/lib/services/articles";

export async function getArticles(
  params: IGetArticlesParams = {}
): Promise<IPaginatedResponse<ISerializedArticle>> {
  try {
    return await getArticlesService(params);
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw new Error(`Failed to fetch articles: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
```

#### API Route (`app/api/v1/articles/route.ts`)
```typescript
import { getArticlesService } from "@/lib/services/articles";

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const params = parseQueryParams(searchParams);
    
    const result = await getArticlesService(params);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError("Get all articles failed!", error as string);
  }
};
```

#### Server Component Usage
```typescript
import { getArticles } from "@/app/actions/article/getArticles";

export default async function HomePage() {
  const articlesResponse = await getArticles({ 
    page: 1, 
    limit: 6, 
    locale: 'en' 
  });
  
  return (
    <div>
      <FeaturedArticles articles={articlesResponse.data} />
    </div>
  );
}
```

### 2. Search with Pagination

#### Service (`lib/services/articles.ts`)
```typescript
export async function getArticlesPaginatedService(
  params: GetArticlesServiceParams
): Promise<IPaginatedResponse<ISerializedArticle>> {
  // Service handles search query in buildFilter
  // Returns paginated results with locale filtering
  return await getArticlesService({ ...params, query: params.query });
}
```

#### Server Action (`app/actions/article/searchArticlesPaginated.ts`)
```typescript
"use server";

import { getArticlesPaginatedService } from "@/lib/services/articles";

export async function searchArticlesPaginated(
  params: IGetArticlesParams & { query: string }
): Promise<IPaginatedResponse<ISerializedArticle>> {
  try {
    return await getArticlesPaginatedService(params);
  } catch (error) {
    console.error("Error searching articles:", error);
    throw new Error(`Failed to search articles: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
```

### 3. Article Likes

#### Service (`lib/services/articles.ts`)
```typescript
export async function toggleArticleLikeService(
  articleId: string, 
  userId: string
): Promise<{ liked: boolean; likeCount: number }> {
  await connectDb();
  
  const article = await Article.findById(articleId);
  if (!article) {
    throw new Error("Article not found");
  }
  
  const userLiked = article.likes?.includes(new mongoose.Types.ObjectId(userId));
  
  const updateOperation = userLiked
    ? { $pull: { likes: userId } }
    : { $addToSet: { likes: userId } };
  
  const updatedArticle = await Article.findByIdAndUpdate(
    articleId,
    updateOperation,
    { new: true }
  );
  
  return {
    liked: !userLiked,
    likeCount: updatedArticle.likes?.length || 0,
  };
}
```

#### Server Action (`app/actions/article/toggleArticleLike.ts`)
```typescript
"use server";

import { toggleArticleLikeService } from "@/lib/services/articles";

export async function toggleArticleLike(
  articleId: string, 
  userId: string
): Promise<LikeResponse> {
  try {
    const result = await toggleArticleLikeService(articleId, userId);
    return {
      success: true,
      ...result,
      message: result.liked ? "Article liked" : "Article unliked"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle like"
    };
  }
}
```

#### API Route (`app/api/v1/articles/by-id/[articleId]/likes/route.ts`)
```typescript
import { toggleArticleLikeService } from "@/lib/services/articles";

export const POST = async (req: Request, context: { params: Promise<{ articleId: string }> }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { articleId } = await context.params;
  
  try {
    const result = await toggleArticleLikeService(articleId, session.user.id);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return handleApiError("Toggle article like failed!", error as string);
  }
};
```

## Key Features

### 1. Consistent Response Format

Both server actions and API routes return the same data structure:

```typescript
interface IPaginatedResponse<T> {
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  data: T[];
}

interface ISerializedArticle {
  _id: string;
  category: string;
  likes: string[];
  contentsByLanguage: ISerializedArticleContent[];
  createdBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 2. Smart Routing

API routes intelligently select the appropriate server action:

```typescript
// Smart routing logic
if (query && query.trim()) {
  result = await searchArticlesPaginated(params);
} else if (category) {
  result = await getArticlesByCategoryPaginated(params);
} else {
  result = await getArticles(params);
}
```

### 3. Pagination Strategies

Different pagination strategies optimized for different use cases:

- **Normal Pagination**: MongoDB `.skip()` and `.limit()` for simple queries
- **Fetch All Then Paginate**: For complex filtering scenarios (search)
- **ExcludeIds Support**: For complex layouts with featured articles

### 4. Error Handling

- Server actions return empty responses instead of throwing errors
- API routes handle HTTP status codes appropriately
- Consistent error messages across both interfaces
- Graceful degradation for missing data

### 5. Type Safety

- Shared interfaces ensure consistency across the application
- TypeScript provides compile-time safety
- Serialized data types prevent runtime errors

### 6. Performance Optimization

- Efficient MongoDB queries with proper indexing
- Lean queries for better performance
- Population only when needed
- Optimized serialization process

## Data Flow Patterns

### 1. Server Component Flow (Simple DB Operation)
```
User Request → Server Component → Server Action → Service → Database → Serialization → Client Component
```

### 2. API Route Flow (Simple DB Operation)
```
Third-party Request → API Route → Service → Database → Serialization → JSON Response
```

### 3. Server Component Flow (Complex Operation with Files/Email)
```
User Request → Server Component → Server Action → API Route → Service → Database
                                                      ↓
                                              File Upload/Email
```

### 4. API Route Flow (Complex Operation with Files/Email)
```
Third-party Request → API Route → File Upload/Email → Service → Database → JSON Response
```

### Key Difference from Old Architecture

**Old Pattern:**
- Server Action → `internalFetch` → API Route → Database
- Double HTTP overhead on server-side

**New Pattern:**
- Server Action → Service → Database (direct)
- API Route → Service → Database (direct)
- No server-side HTTP hops

## Migration Strategy

When migrating to service-oriented architecture:

1. **Create Service**: Extract database logic to `lib/services/<domain>.ts`
2. **Update API Route**: Replace DB logic with service call
3. **Update Server Action**: Replace `internalFetch` with direct service call
4. **Handle Complex Operations**: For file uploads/email, route handles orchestration, service handles DB
5. **Test Both Interfaces**: Verify both server action and API route work correctly
6. **Update Components**: Server components can use actions or services directly
7. **Handle Type Changes**: Ensure all components use serialized types
8. **Remove `internalFetch`**: Once all domains migrate (except deferred complex operations)

## Best Practices

1. **Services are Pure**: Services contain only DB logic, no HTTP/file handling
2. **Routes Handle HTTP**: Routes parse requests, handle files/email, call services
3. **Actions are Thin**: Actions either call services directly or routes (for complex ops)
4. **Use Shared Interfaces**: Define interfaces in shared locations (`types/`)
5. **Consistent Error Handling**: Services throw `Error`, routes wrap with `handleApiError`
6. **Reuse Helpers**: Services use `fieldProjections`, `serializeMongoObject`, etc.
7. **No `internalFetch`**: Direct service calls eliminate server-side HTTP overhead
8. **Test Both Paths**: Always test both server action and API route functionality
9. **Optimize Queries**: Use lean queries, proper projections, and indexing
10. **Handle Serialization**: Services return serialized data ready for client consumption
11. **Validate Inputs**: Validate parameters in services (throw errors)
12. **Use TypeScript**: Leverage TypeScript for type safety across all layers

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure all components use `ISerializedArticle` instead of `IArticle`
2. **Pagination Duplicates**: Check if using correct pagination strategy
3. **Serialization Issues**: Verify `serializeMongoObject` is used consistently
4. **Performance Issues**: Check database queries and indexing
5. **API Errors**: Verify parameter validation and error handling

### Debug Tips

1. Check server action return values
2. Verify API route parameter parsing
3. Test with different locales
4. Check MongoDB query performance
5. Verify serialization is working correctly
6. Test pagination across different scenarios

## File Structure

```
app/
├── actions/           # Server actions (thin wrappers)
│   ├── article/       # Article-related actions
│   ├── auth/          # Authentication actions
│   ├── newsletter/    # Newsletter actions
│   ├── subscribers/   # Subscriber management actions
│   ├── user/          # User-related actions
│   └── comment/       # Comment management actions
├── api/              # API routes (HTTP endpoints)
│   └── v1/
│       ├── articles/  # Article endpoints
│       ├── auth/      # Authentication endpoints
│       ├── newsletter/# Newsletter endpoints
│       ├── subscribers/# Subscriber endpoints
│       ├── users/     # User endpoints
│       └── upload/    # Upload endpoints
└── [locale]/         # Server components (use actions or services)
    └── page.tsx

lib/
└── services/         # Service layer (database logic)
    ├── articles.ts    # Article operations
    ├── comments.ts   # Comment operations
    ├── users.ts      # User operations
    ├── subscribers.ts# Subscriber operations
    ├── newsletter.ts # Newsletter operations
    ├── auth.ts       # Auth operations
    ├── upload.ts     # Upload operations
    └── README.md     # Service guidelines
```

## Benefits of Service-Oriented Architecture

1. **Single Source of Truth**: All DB logic in one place (services)
2. **No Server-Side HTTP**: Direct service calls eliminate `internalFetch` overhead
3. **Better Performance**: No unnecessary network hops on server
4. **Easier Testing**: Services are pure functions, easy to test
5. **Consistent Error Handling**: Services throw, routes wrap
6. **Reusability**: Same service used by actions and routes
7. **Maintainability**: Changes to DB logic in one place
8. **Type Safety**: Shared interfaces ensure consistency
9. **Separation of Concerns**: Clear boundaries between layers
10. **Scalability**: Easy to add new operations or domains

This architecture provides a clean separation of concerns while maintaining flexibility, performance, and reusability.
