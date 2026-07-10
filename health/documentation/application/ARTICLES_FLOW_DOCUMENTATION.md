# Articles Flow Documentation

## Overview

This document provides a comprehensive guide to the articles system architecture, including server actions, API routes, and the complete data flow for all article-related features.

## Architecture Overview

The articles system follows a **Server Actions + API Routes** architecture where:

1. **Server Actions** (`app/actions/article/`) - Handle all database operations
2. **API Routes** (`app/api/v1/`) - Provide HTTP endpoints for third-party access
3. **Server Components** - Use server actions directly
4. **Client Components** - Receive serialized data from server components

## Server Actions

### 1. `getArticles.ts`
**Purpose**: Fetch articles with general filtering and pagination

**Parameters**:
```typescript
interface IGetArticlesParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  locale?: string;
  category?: string;
  slug?: string;
  query?: string;
  excludeIds?: string[];
}
```

**Returns**: `Promise<IPaginatedResponse<ISerializedArticle>>`

**Usage**:
- Server components: Direct import and call
- API routes: Import and use in HTTP handlers
- Features: Home page, general article listing

**Example**:
```typescript
const result = await getArticles({
  page: 1,
  limit: 6,
  locale: 'en',
  sort: 'createdAt',
  order: 'desc'
});
```

### 2. `getArticleBySlug.ts`
**Purpose**: Fetch a single article by slug with full content

**Parameters**:
```typescript
{
  slug: string;
  locale?: string;
}
```

**Returns**: `Promise<ISerializedArticle | null>`

**Usage**:
- Server components: Article detail pages
- API routes: Single article endpoints
- Features: Article reading, sharing

**Example**:
```typescript
const article = await getArticleBySlug({
  slug: 'healthy-nutrition-tips',
  locale: 'en'
});
```

### 3. `getArticlesByCategory.ts`
**Purpose**: Fetch articles filtered by category (non-paginated)

**Parameters**:
```typescript
{
  category: string;
  locale?: string;
  limit?: number;
  excludeIds?: string[];
}
```

**Returns**: `Promise<IPaginatedResponse<ISerializedArticle>>`

**Usage**:
- Server components: Category carousels
- API routes: Category-specific endpoints
- Features: Category navigation, featured articles

### 4. `getArticlesByCategoryPaginated.ts`
**Purpose**: Fetch paginated articles by category with advanced filtering

**Parameters**:
```typescript
{
  category: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  locale?: string;
  slug?: string;
  query?: string;
  excludeIds?: string[];
}
```

**Returns**: `Promise<IPaginatedResponse<ISerializedArticle>>`

**Usage**:
- Server components: Category pages with pagination
- API routes: Paginated category endpoints
- Features: Category browsing, pagination

### 5. `searchArticlesPaginated.ts`
**Purpose**: Search articles with pagination and locale filtering

**Parameters**:
```typescript
{
  query: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  locale?: string;
  category?: string;
  slug?: string;
  excludeIds?: string[];
}
```

**Returns**: `Promise<IPaginatedResponse<ISerializedArticle>>`

**Usage**:
- Server components: Search results pages
- API routes: Search endpoints
- Features: Article search, search pagination

**Special Note**: Uses "fetch all then paginate" approach due to complex locale filtering

### 6. `toggleArticleLike.ts`
**Purpose**: Handle article like/unlike functionality

**Parameters**:
```typescript
{
  articleId: string;
  userId: string;
}
```

**Returns**:
```typescript
{
  success: boolean;
  liked?: boolean;
  likeCount?: number;
  message?: string;
  error?: string;
}
```

**Usage**:
- Server components: Like buttons
- API routes: Like endpoints
- Features: User engagement, social features

## Article Creation

### Article Creation Flow
```
User submits article form with images
↓
POST /api/v1/articles (multipart/form-data)
↓
app/api/v1/articles/route.ts (API Route)
↓
Form validation + Image upload to Cloudinary
↓
MongoDB Article creation
↓
JSON Response with created article
```

### Article Creation Features
- **Multilingual Support**: Multiple language versions in single article
- **Image Upload**: Automatic Cloudinary integration
- **SEO Validation**: Complete SEO metadata validation
- **Slug Uniqueness**: Prevents duplicate slugs across languages
- **Content Validation**: Comprehensive content structure validation
- **Authentication Required**: Only authenticated users can create articles

## API Routes

### 1. `/api/v1/articles/route.ts`
**Purpose**: Main articles endpoint with smart routing

**Methods**:
- `GET` - Fetch articles with various filters
- `POST` - Create new article (with image upload)

**Query Parameters** (GET):
- `page`, `limit`, `sort`, `order`, `locale`, `category`, `slug`, `excludeIds`

**Smart Routing Logic**:
```typescript
if (category) {
  // Use getArticlesByCategory when category is specified
  result = await getArticlesByCategory(params);
} else {
  // Use getArticles for general article fetching (no category filter)
  result = await getArticles(params);
}
```

**POST Request** (Create Article):
- **Content-Type**: `multipart/form-data`
- **Required Fields**: `category`, `contentsByLanguage`, `articleImages`
- **Authentication**: Required
- **Features**: Image upload to Cloudinary, multilingual content validation

**Response Format**:
```typescript
{
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  data: ISerializedArticle[];
}
```

### 2. `/api/v1/articles/paginated/route.ts`
**Purpose**: Dedicated paginated articles endpoint with advanced features

**Methods**:
- `GET` - Fetch paginated articles with search and category filtering

**Query Parameters**:
- `page`, `limit`, `sort`, `order`, `locale`, `category`, `slug`, `excludeIds`, `query`
- **Required**: Either `query` or `category` parameter

**Smart Routing Logic**:
```typescript
if (query && query.trim()) {
  // Use searchArticlesPaginated for search queries
  result = await searchArticlesPaginated(params);
} else if (category) {
  // Use getArticlesByCategoryPaginated for category queries
  result = await getArticlesByCategoryPaginated(params);
} else {
  // Return error - at least one parameter required
}
```

### 3. `/api/v1/articles/by-slug/[slug]/route.ts`
**Purpose**: Single article endpoint by slug

**Methods**:
- `GET` - Fetch single article by slug

**Parameters**:
- `slug` - Article slug from URL path
- `locale` - Query parameter (default: 'en')

**Features**:
- Full article content with populated author and comments
- Locale-specific content filtering
- SEO metadata included

**Response Format**:
```typescript
ISerializedArticle | null
```

### 4. `/api/v1/articles/by-id/[articleId]/likes/route.ts`
**Purpose**: Article likes management

**Methods**:
- `POST` - Toggle article like (add/remove)
- `GET` - Get article like status and count

**Parameters**:
- `articleId` - Article ID from URL path

**Authentication**: Required for POST, optional for GET

**Features**:
- Atomic like/unlike operations
- Duplicate prevention
- Real-time like count updates

**Response Format**:
```typescript
// POST Response
{
  success: boolean;
  liked: boolean;
  likeCount: number;
  message: string;
}

// GET Response
{
  success: boolean;
  likeCount: number;
  userLiked: boolean;
  message: string;
}
```

## Data Flow Examples

### 1. Home Page Flow
```
User visits /en
↓
app/[locale]/page.tsx (Server Component)
↓
getArticles({ page: 1, limit: 6, locale: 'en' })
↓
MongoDB Query + Serialization
↓
pagesClient/Home.tsx (Client Component)
↓
components/FeaturedArticles.tsx
```

### 2. Category Page Flow
```
User visits /en/nutrition?page=2
↓
app/[locale]/[category]/page.tsx (Server Component)
↓
getArticlesByCategoryPaginated({ category: 'nutrition', page: 2, locale: 'en' })
↓
MongoDB Query + Locale Filtering + Pagination
↓
pagesClient/Articles.tsx (Client Component)
↓
Pagination Controls + Article Cards
```

### 3. Search Flow
```
User searches "healthy recipes"
↓
app/[locale]/search/page.tsx (Server Component)
↓
searchArticlesPaginated({ query: 'healthy recipes', locale: 'en' })
↓
MongoDB Query + Locale Filtering + Search + Pagination
↓
pagesClient/Search.tsx (Client Component)
↓
Search Results + Pagination
```

### 4. Article Detail Flow
```
User visits /en/nutrition/healthy-nutrition-tips
↓
app/[locale]/[category]/[slug]/page.tsx (Server Component)
↓
getArticleBySlug({ slug: 'healthy-nutrition-tips', locale: 'en' })
↓
MongoDB Query + Population + Locale Filtering
↓
pagesClient/Article.tsx (Client Component)
↓
Article Content + Comments + Like Button
```

### 5. API Access Flow
```
Third-party app calls GET /api/v1/articles?category=nutrition&page=2
↓
app/api/v1/articles/route.ts (API Route)
↓
getArticlesByCategory({ category: 'nutrition', page: 2 })
↓
MongoDB Query + Serialization
↓
JSON Response with pagination metadata
```

### 6. Search API Flow
```
Third-party app calls GET /api/v1/articles/paginated?query=healthy&page=1
↓
app/api/v1/articles/paginated/route.ts (API Route)
↓
searchArticlesPaginated({ query: 'healthy', page: 1 })
↓
MongoDB Query + Locale Filtering + Search + Pagination
↓
JSON Response with search results
```

### 7. Single Article API Flow
```
Third-party app calls GET /api/v1/articles/by-slug/healthy-nutrition-tips?locale=en
↓
app/api/v1/articles/by-slug/[slug]/route.ts (API Route)
↓
getArticleBySlug('healthy-nutrition-tips', 'en')
↓
MongoDB Query + Population + Locale Filtering
↓
JSON Response with full article data
```

### 8. Article Likes API Flow
```
User clicks like button → POST /api/v1/articles/by-id/123/likes
↓
app/api/v1/articles/by-id/[articleId]/likes/route.ts (API Route)
↓
toggleArticleLike('123', userId)
↓
MongoDB Atomic Update
↓
JSON Response with updated like status
```

## Key Features

### 1. Type Safety
- All actions use shared interfaces (`IGetArticlesParams`, `ISerializedArticle`)
- Consistent return types across server actions and API routes
- TypeScript ensures compile-time safety

### 2. Serialization
- MongoDB objects are serialized to plain objects
- `ObjectId` and `Date` objects converted to strings
- Client components receive serialized data

### 3. Locale Support
- All actions support locale filtering
- Fallback to English if locale not found
- Content filtering by `contentsByLanguage` array

### 4. Pagination
- Consistent pagination metadata across all actions
- Smart pagination logic based on use case
- Support for `excludeIds` for complex scenarios

### 5. Error Handling
- Server actions return empty responses instead of throwing
- API routes handle HTTP status codes appropriately
- Graceful degradation for missing data

## Performance Considerations

### 1. Database Queries
- Efficient MongoDB queries with proper indexing
- Population only when needed
- Lean queries for better performance

### 2. Pagination Strategies
- **Normal Pagination**: Uses MongoDB `.skip()` and `.limit()`
- **Fetch All Then Paginate**: Used when complex filtering is required
- **Smart Selection**: API routes choose optimal strategy

### 3. Caching
- Server-side rendering provides built-in caching
- API routes can be cached at CDN level
- Database queries are optimized for performance

## Testing

### Server Actions
```typescript
// Test server action directly
const result = await getArticles({ page: 1, limit: 6 });
console.log(result.data.length); // Should be 6 or less
```

### API Routes
```bash
# Test main articles endpoint
curl "http://localhost:3000/api/v1/articles?category=nutrition&page=1"

# Test paginated endpoint with search
curl "http://localhost:3000/api/v1/articles/paginated?query=healthy&page=1"

# Test single article by slug
curl "http://localhost:3000/api/v1/articles/by-slug/healthy-nutrition-tips?locale=en"

# Test article likes (GET)
curl "http://localhost:3000/api/v1/articles/by-id/123/likes"

# Test article likes (POST) - requires authentication
curl -X POST "http://localhost:3000/api/v1/articles/by-id/123/likes" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Integration Testing
1. Test server components render correctly
2. Test API routes return proper JSON
3. Test pagination works across all pages
4. Test search functionality
5. Test like functionality

## Future Enhancements

1. **Caching**: Add Redis caching for frequently accessed data
2. **Real-time Updates**: WebSocket support for live updates
3. **Advanced Search**: Full-text search with Elasticsearch
4. **Analytics**: Track article views and engagement
5. **Recommendations**: AI-powered article recommendations
6. **Comments**: Real-time comment system
7. **Bookmarks**: User bookmark functionality

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure all components use `ISerializedArticle`
2. **Pagination Duplicates**: Check if using correct pagination strategy
3. **Locale Issues**: Verify locale filtering logic
4. **Performance**: Check database queries and indexing
5. **API Errors**: Verify parameter validation and error handling

### Debug Tips

1. Check server action return values
2. Verify API route parameter parsing
3. Test with different locales
4. Check MongoDB query performance
5. Verify serialization is working correctly

This architecture provides a robust, scalable, and maintainable system for handling articles across both server-side rendering and API access.
