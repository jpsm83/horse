# Comment System Documentation

## Overview

The comment system in Women's Spot Health Blog is a fully separated, scalable architecture that allows users to comment on articles with features like likes, reports, and moderation. The system follows the project's server actions + API routes pattern for maximum flexibility and performance.

## Architecture

### Core Principles
- **Separation of Concerns**: Comments are stored in a separate collection, not embedded in articles
- **Performance**: Articles load quickly without comment data, comments are loaded on-demand
- **Scalability**: Comments can grow independently without affecting article performance
- **API Design**: RESTful endpoints for external applications
- **Type Safety**: Full TypeScript support with proper interfaces

### Database Design

#### Comment Model (`app/api/models/comment.ts`)
```typescript
{
  articleId: ObjectId,        // Reference to Article
  userId: ObjectId,           // Reference to User (populated)
  comment: String,            // Comment text (max 1000 chars)
  likes: [ObjectId],          // Array of user IDs who liked
  reports: [ReportSchema],    // Array of report objects
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

#### Article Model Changes
- **Removed**: `comments: [IArticleComment]` (embedded array)
- **Added**: `commentsCount: Number` (counter for performance)

### Indexes for Performance
```typescript
// Compound indexes for efficient queries
{ articleId: 1, createdAt: -1 }                    // Comments by article, newest first
{ userId: 1, createdAt: -1 }                        // User's comments, newest first
```

## Server Actions

### 1. Create Comment (`app/actions/comment/createComment.ts`)

**Purpose**: Create new comments with validation and business rules

**Parameters**:
```typescript
interface ICreateCommentParams {
  articleId: string;
  userId: string;
  comment: string;
}
```

**Business Rules**:
- User must be signed in
- Comment cannot be empty or exceed 1000 characters
- Comment cannot contain links
- User cannot comment on their own articles
- User can only comment once per article
- Updates article's `commentsCount`

**Returns**:
```typescript
{
  success: boolean;
  comment?: ISerializedComment;
  error?: string;
}
```

### 2. Delete Comment (`app/actions/comment/deleteComment.ts`)

**Purpose**: Soft delete comments (admin or owner only)

**Parameters**:
```typescript
interface IDeleteCommentParams {
  commentId: string;
  userId: string;
  isAdmin?: boolean;
}
```

**Business Rules**:
- User must be signed in
- Only comment owner or admin can delete
- Permanent delete (removes from database)
- Updates article's `commentsCount`

### 3. Get Comments (`app/actions/comment/getComments.ts`)

**Purpose**: Fetch comments with advanced filtering and pagination

**Parameters**:
```typescript
interface IGetCommentsParams {
  articleId?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  includeDeleted?: boolean;
}
```

**Features**:
- Pagination support
- Filter by article or user
- Sort by various fields
- Populate user information (username, avatar)

### 4. Toggle Comment Like (`app/actions/comment/toggleCommentLike.ts`)

**Purpose**: Like/unlike comments with atomic operations

**Parameters**:
```typescript
interface IToggleCommentLikeParams {
  commentId: string;
  userId: string;
}
```

**Features**:
- Atomic like/unlike operations
- Returns updated like count
- Prevents duplicate likes

### 5. Report Comment (`app/actions/comment/reportComment.ts`)

**Purpose**: Report inappropriate comments with email notifications

**Parameters**:
```typescript
interface IReportCommentParams {
  commentId: string;
  userId: string;
  reason: string;
}
```

**Features**:
- Validates report reasons
- Prevents duplicate reports
- Sends email notification to comment author
- Tracks report history

## API Routes

### Base URL: `/api/v1/comments`

#### 1. GET `/api/v1/comments`
**Purpose**: Get comments with filtering and pagination
**Access**: Public
**Query Parameters**:
- `articleId` - Filter by article
- `userId` - Filter by user
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Sort field (default: createdAt)
- `order` - Sort order: asc/desc (default: desc)

**Response**:
```json
{
  "success": true,
  "data": {
    "comments": [...],
    "totalCount": 50,
    "hasMore": true,
    "page": 1,
    "limit": 10
  }
}
```

#### 2. POST `/api/v1/comments`
**Purpose**: Create new comment
**Access**: Private (requires authentication)
**Body**:
```json
{
  "articleId": "article_id",
  "comment": "Comment text"
}
```

#### 3. DELETE `/api/v1/comments/[commentId]`
**Purpose**: Delete specific comment
**Access**: Private (owner or admin only)
**Parameters**: `commentId` in URL path

#### 4. POST `/api/v1/comments/[commentId]/likes`
**Purpose**: Toggle comment like
**Access**: Private (requires authentication)
**Parameters**: `commentId` in URL path

#### 5. POST `/api/v1/comments/[commentId]/reports`
**Purpose**: Report comment
**Access**: Private (requires authentication)
**Parameters**: `commentId` in URL path
**Body**:
```json
{
  "reason": "spam|harassment|inappropriate_content|..."
}
```

#### 6. GET `/api/v1/comments/by-article/[articleId]`
**Purpose**: Get comments for specific article
**Access**: Public
**Parameters**: `articleId` in URL path
**Query Parameters**: Same as GET `/api/v1/comments`

## Frontend Integration

### CommentsSection Component (`components/CommentsSection.tsx`)

**Props**:
```typescript
interface CommentsSectionProps {
  articleId: string;
  comments: ISerializedComment[];
  setComments: React.Dispatch<React.SetStateAction<ISerializedComment[]>>;
  hasUserCommented: boolean;
}
```

**Features**:
- Comment creation form (one per user per article)
- Comment display with user avatars and usernames
- Like/unlike functionality
- Report functionality with modal
- Delete functionality (owner/admin only)
- Real-time UI updates

### Article Component Integration (`pagesClient/Article.tsx`)

**Comment Loading**:
```typescript
useEffect(() => {
  const loadComments = async () => {
    if (articleData?._id) {
      const result = await getComments({
        articleId: articleData._id,
        page: 1,
        limit: 50,
        sort: "createdAt",
        order: "desc",
      });
      
      if (result.success && result.comments) {
        setComments(result.comments);
      }
    }
  };
  loadComments();
}, [articleData?._id]);
```

## Data Flow

### Comment Creation Flow
1. User submits comment form
2. `createComment` action validates input
3. Comment saved to database
4. Article's `commentsCount` incremented
5. UI updated with new comment
6. User sees success message

### Comment Display Flow
1. Article component loads
2. `getComments` action fetches comments
3. Comments populated with user data
4. CommentsSection renders with user info
5. Real-time updates on interactions

### Comment Interaction Flow
1. User clicks like/report/delete
2. Corresponding action called
3. Database updated atomically
4. UI state updated immediately
5. Success/error feedback shown

## TypeScript Interfaces

### Core Interfaces (`interfaces/comment.ts`)

```typescript
// Comment with populated user data
interface ISerializedComment {
  _id: string;
  articleId: string;
  userId: string | { _id: string; username: string; imageUrl?: string };
  comment: string;
  likes?: string[];
  reports?: ISerializedCommentReport[];
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Comment report
interface ISerializedCommentReport {
  userId: string;
  reason: 'bad_language' | 'racist' | 'spam' | 'harassment' | 'inappropriate_content' | 'false_information' | 'other';
  reportedAt: string;
}
```

## Performance Considerations

### Database Optimization
- **Compound indexes** for common query patterns
- **Pagination** to limit data transfer
- **Lean queries** for better performance
- **Selective population** of user data

### Frontend Optimization
- **On-demand loading** of comments
- **Optimistic updates** for better UX
- **Debounced interactions** to prevent spam
- **Error boundaries** for graceful failures

## Security Features

### Input Validation
- Comment length limits (1000 characters)
- Link detection and blocking
- XSS prevention through proper escaping
- SQL injection prevention through parameterized queries

### Access Control
- Authentication required for all write operations
- Owner/admin-only delete permissions
- Rate limiting on comment creation
- Report abuse prevention

### Data Protection
- Soft delete for audit trails
- Report tracking for moderation
- User data privacy in API responses
- Secure token-based operations

## Migration from Embedded Comments

### Migration Script (`scripts/migrate-comments.ts`)
- Moves embedded comments to separate collection
- Updates article `commentsCount` fields
- Preserves all comment data and relationships
- Provides rollback safety

### Backward Compatibility
- API maintains same response structure
- Frontend components work without changes
- Gradual migration with zero downtime

## Error Handling

### Server Actions
- Consistent error response format
- Detailed error messages for debugging
- Graceful fallbacks for failed operations
- Logging for monitoring and debugging

### API Routes
- HTTP status codes following REST conventions
- JSON error responses with details
- Input validation with clear error messages
- Rate limiting and abuse prevention

## Monitoring and Analytics

### Metrics to Track
- Comment creation rate
- Like engagement rate
- Report frequency and reasons
- User participation patterns
- Performance metrics (load times, error rates)

### Logging
- All comment operations logged
- Error tracking and alerting
- User behavior analytics
- Performance monitoring

## Future Enhancements

### Planned Features
- Comment threading/replies
- Comment moderation dashboard
- Advanced filtering and search
- Comment analytics and insights
- Real-time notifications
- Comment editing capabilities

### Scalability Improvements
- Redis caching for popular comments
- CDN integration for static assets
- Database sharding for large datasets
- Microservices architecture for comment service

## Troubleshooting

### Common Issues
1. **"Unknown User" displayed**: Check user population in `getComments`
2. **Comments not loading**: Verify database connection and query parameters
3. **Like count not updating**: Check atomic operations in `toggleCommentLike`
4. **Permission errors**: Verify user authentication and role checking

### Debug Tools
- Console logging in development
- Database query monitoring
- Network request inspection
- Error boundary reporting

## API Testing

### Test Endpoints
```bash
# Get comments for article
GET /api/v1/comments?articleId=ARTICLE_ID&page=1&limit=10

# Create comment
POST /api/v1/comments
{
  "articleId": "ARTICLE_ID",
  "comment": "Great article!"
}

# Like comment
POST /api/v1/comments/COMMENT_ID/likes

# Report comment
POST /api/v1/comments/COMMENT_ID/reports
{
  "reason": "spam"
}
```

This documentation provides a comprehensive overview of the comment system architecture, implementation details, and usage patterns. It serves as a reference for developers working with the comment functionality and helps maintain consistency across the codebase.
