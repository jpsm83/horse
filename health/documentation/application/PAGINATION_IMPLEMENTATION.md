# Pagination Implementation

## Overview

This document explains the comprehensive pagination implementation across all article-related features. The pagination system supports multiple strategies optimized for different use cases, all implemented using **server-side pagination** for better performance and SEO benefits.

## Architecture

### Server-Side Pagination
- **Why Server-Side**: Better performance, SEO-friendly URLs, direct page links work
- **URL Structure**: `/{locale}/{category}?page={pageNumber}`, `/{locale}/search?q={query}&page={pageNumber}`
- **Examples**: `/en/nutrition?page=2`, `/en/search?q=healthy&page=3`

### Pagination Strategies

#### 1. Normal Pagination (MongoDB Native)
- **Use Case**: Simple filtering (category, basic queries)
- **Method**: Uses MongoDB `.skip()` and `.limit()`
- **Performance**: Most efficient for simple queries
- **Used By**: Category pagination, basic article listing

#### 2. Fetch All Then Paginate
- **Use Case**: Complex filtering (search with locale filtering)
- **Method**: Fetches all results, applies filtering, then paginates
- **Performance**: Less efficient but necessary for complex scenarios
- **Used By**: Search pagination, complex filtering scenarios

### Components Involved

1. **Server Components**: 
   - `app/[locale]/[category]/page.tsx` - Category pages
   - `app/[locale]/search/page.tsx` - Search pages
   - `app/[locale]/page.tsx` - Home page

2. **Client Components**: 
   - `pagesClient/Articles.tsx` - Category pagination
   - `pagesClient/Search.tsx` - Search pagination
   - `pagesClient/Home.tsx` - Home page articles

3. **Server Actions**: `app/actions/article/`
   - `getArticlesByCategoryPaginated.ts` - Category pagination
   - `searchArticlesPaginated.ts` - Search pagination
   - `getArticles.ts` - General article fetching

4. **API Routes**: `app/api/v1/`
   - `articles/route.ts` - Main articles endpoint
   - `articles/paginated/route.ts` - Dedicated pagination endpoint

## Implementation Details

### URL Parameters
- `page`: Current page number (default: 1)
- `q`: Search query (for search pages)
- `category`: Category filter (for category pages)
- `locale`: Language preference (default: 'en')
- Invalid page numbers are handled gracefully
- Redirects to page 1 if page exceeds total pages

### Pagination Data Structure
```typescript
interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalArticles: number;
}
```

### API Response Structure
```typescript
interface IPaginatedResponse<T> {
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  data: T[];
}
```

### Server Action Parameters
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

## Features

### Pagination Controls
- **Previous/Next Buttons**: Navigate between pages
- **Page Numbers**: Direct navigation to specific pages
- **Ellipsis**: Shows "..." for large page ranges
- **Smart Display**: Shows first, last, current, and adjacent pages

### Pagination Strategies by Use Case

#### Category Pagination
- **Strategy**: Normal MongoDB pagination
- **Features**: ExcludeIds support for complex layouts
- **Performance**: Optimized for category filtering
- **Example**: `/en/nutrition?page=2`

#### Search Pagination
- **Strategy**: Fetch all then paginate
- **Features**: Complex locale filtering, search queries
- **Performance**: Necessary for accurate results
- **Example**: `/en/search?q=healthy&page=3`

#### General Article Pagination
- **Strategy**: Normal MongoDB pagination
- **Features**: Flexible filtering options
- **Performance**: Efficient for general queries
- **Example**: Home page, API endpoints

### Edge Cases Handled
- Empty articles array
- Invalid page numbers
- Page numbers exceeding total pages
- Single page scenarios (no pagination shown)
- Search queries with no results
- Locale filtering with missing translations

### User Experience
- **Pagination Info**: Shows current page and total articles
- **Responsive Design**: Works on all screen sizes
- **SEO-Friendly**: Each page has a unique URL
- **Loading States**: Handled by server-side rendering
- **Search Context**: Maintains search query across pages
- **Category Context**: Maintains category context across pages

## Usage

### Adding Pagination to New Pages

#### For Category Pages
1. Create server component: `app/[locale]/[category]/page.tsx`
2. Use `getArticlesByCategoryPaginated` server action
3. Pass data to client component with pagination metadata
4. Use pagination component in client

#### For Search Pages
1. Create server component: `app/[locale]/search/page.tsx`
2. Use `searchArticlesPaginated` server action
3. Handle search query parameters
4. Use search-specific pagination component

#### For General Article Pages
1. Use `getArticles` server action
2. Configure appropriate parameters
3. Handle pagination metadata
4. Use generic pagination component

### Customizing Pagination
- **Articles per page**: Change `limit` in server component
- **Pagination styling**: Modify `components/ui/pagination.tsx`
- **Pagination logic**: Update pagination component in respective client components
- **Strategy selection**: Choose appropriate pagination strategy based on use case

## Benefits

1. **Performance**: Only loads needed data
2. **SEO**: Each page is indexable
3. **User Experience**: Direct links to specific pages
4. **Scalability**: Handles large datasets efficiently
5. **Accessibility**: Proper ARIA labels and navigation

## Future Improvements

1. **Caching**: Add Redis caching for frequently accessed pages
2. **Infinite Scroll**: Alternative to pagination for mobile
3. **Advanced Filters**: Add more filtering options with pagination
4. **Real-time Search**: Live search with pagination
5. **Analytics**: Track pagination usage and user behavior
6. **Performance Optimization**: Query optimization and indexing
7. **Mobile Optimization**: Touch-friendly pagination controls

## Testing

### Manual Testing
1. **Category Pagination**: Navigate to `/{locale}/{category}?page=2`
2. **Search Pagination**: Search for terms and navigate pages
3. **Invalid Pages**: Try page numbers exceeding total pages
4. **Empty States**: Test with empty categories/search results
5. **API Endpoints**: Test pagination via API routes

### Automated Testing
```typescript
// Test server actions
const result = await getArticlesByCategoryPaginated({
  category: 'nutrition',
  page: 1,
  limit: 6
});
expect(result.data.length).toBeLessThanOrEqual(6);

// Test API routes
const response = await fetch('/api/v1/articles?category=nutrition&page=1');
const data = await response.json();
expect(data.data).toBeDefined();
expect(data.totalPages).toBeGreaterThan(0);
```

### Performance Testing
1. Test with large datasets
2. Monitor database query performance
3. Check memory usage with different pagination strategies
4. Test concurrent pagination requests
