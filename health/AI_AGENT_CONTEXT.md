# AI Agent Context - Women's Spot Health Blog

## Application Overview

**Women's Spot** is a multilingual health and wellness blog platform specifically designed for women. The application focuses on providing evidence-based content about women's health, wellness, and well-being topics to help women live happier, healthier, and more fulfilling lives.

## Core Principles for AI Agent

When working on this application, follow these strict guidelines:

1. **Never do more or less than what you've been asked to do**
2. **Do not overcomplicate the code - keep it simple**
3. **Always follow Next.js best practices**
4. **Do not complement the user's question - just answer directly**
5. **Always suggest if there's a better way to handle the issue**

## Technology Stack

- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js v5 (Google OAuth + Credentials)
- **Styling**: Tailwind CSS v4
- **Internationalization**: next-intl (9 languages supported)
- **Email**: Nodemailer with Gmail
- **Image Management**: Cloudinary
- **UI Components**: Radix UI + Custom components
- **State Management**: React hooks + Context

## Supported Languages

The application supports 9 languages:
- English (en)
- Portuguese (pt)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Dutch (nl)

## Main Features

### 1. Article Management
- **Multilingual Articles**: Each article supports content in all 9 languages
- **Categories**: 7 main categories (health, fitness, nutrition, intimacy, beauty, weightLoss, life)
- **Article Status**: Published/Archived
- **SEO Optimization**: Meta titles, descriptions, keywords, canonical URLs
- **Image Management**: Minimum 4 images per article via Cloudinary
- **Reading Time**: Automatic calculation
- **Views Tracking**: Article view counter

### 2. User Management
- **Authentication**: Google OAuth + Email/Password
- **User Roles**: Admin, User
- **User Preferences**: Language, Region
- **Profile Management**: Username, email, birth date, profile image
- **Email Verification**: Required for account activation
- **Password Reset**: Secure token-based reset

### 3. Content Interaction
- **Article Likes**: Users can like articles
- **Comments System**: Users can comment on articles
- **Comment Likes**: Users can like comments
- **Comment Reporting**: Users can report inappropriate comments
- **Reading History**: Track user's article reading history

### 4. Newsletter System
- **Subscription Management**: Users can subscribe to newsletters
- **Email Confirmation**: Double opt-in process
- **Frequency Options**: Daily, Weekly, Monthly
- **Category Preferences**: Users can choose preferred content categories
- **Unsubscribe**: Easy unsubscribe process

### 5. Email Notifications
- **Email Confirmation**: Account verification emails
- **Password Reset**: Secure password reset emails
- **Newsletter Confirmation**: Newsletter subscription confirmation
- **Comment Reports**: Notifications for reported comments
- **Multilingual Email Templates**: All emails support multiple languages

## Database Schema

### Article Model
```typescript
interface IArticle {
  _id?: Types.ObjectId;
  contentsByLanguage: IContentsByLanguage[]; // Multilingual content
  category: string; // One of 11 main categories
  articleImages: string[]; // Cloudinary URLs
  status: "published" | "archived";
  likes: Types.ObjectId[]; // User IDs who liked
  comments: IArticleComment[];
  views: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### User Model
```typescript
interface IUser {
  _id?: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: "admin" | "user";
  birthDate: Date;
  imageUrl?: string;
  preferences: {
    language: string;
    region: string;
  };
  likedArticles: Types.ObjectId[];
  commentedArticles: Types.ObjectId[];
  readingHistory: IReadingHistoryItem[];
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}
```

## File Structure

```
app/
├── [locale]/                 # Internationalized routes
│   ├── [category]/          # Article categories
│   ├── about/               # About page
│   ├── dashboard/           # User dashboard
│   ├── profile/             # User profile
│   ├── create-article/      # Article creation
│   └── auth pages/          # Sign in, sign up, etc.
├── actions/                 # Server actions
│   ├── email/              # Email-related actions
│   ├── article/            # Article actions
│   ├── comment/            # Comment actions
│   └── user/               # User actions
├── api/                    # API routes
│   ├── v1/                 # API version 1
│   │   ├── articles/       # Article endpoints
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User management
│   │   └── subscribers/    # Newsletter
│   └── models/             # Database models
components/                  # React components
├── ui/                     # Reusable UI components
├── skeletons/              # Loading skeletons
└── main components/        # Feature components
hooks/                      # Custom React hooks
interfaces/                 # TypeScript interfaces
lib/                        # Utility libraries
├── cloudinary/            # Image management
├── email/                 # Email services
└── utils/                 # Helper functions
messages/                   # Translation files (9 languages)
services/                   # Business logic services
```

## Key Constants

```typescript
// Main article categories
export const mainCategories = [
  "health", "fitness", "nutrition", "intimacy", "beauty", "weightLoss"
];

// User roles
export const roles = ["admin", "user"];

// Article status
export const articleStatus = ["published", "archived"];

// Newsletter frequencies
export const newsletterFrequencies = ["daily", "weekly", "monthly"];
```

## API Endpoints

### Articles
- `GET /api/v1/articles` - Get all articles (paginated)
- `GET /api/v1/articles/[slug]` - Get single article
- `POST /api/v1/articles` - Create article (admin only)

### Authentication
- `POST /api/v1/auth/signin` - Sign in
- `POST /api/v1/auth/signup` - Sign up
- `GET /api/v1/auth/confirm-email` - Email confirmation
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset

### Users
- `GET /api/v1/users` - Get users (admin only)
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/[userId]` - Get user profile
- `PUT /api/v1/users/[userId]` - Update user

### Newsletter
- `POST /api/v1/subscribers` - Subscribe to newsletter
- `GET /api/v1/subscribers/confirm` - Confirm subscription
- `DELETE /api/v1/subscribers/[subscriberId]` - Unsubscribe

## Environment Variables Required

```env
# Database
MONGODB_URI=

# Authentication
NEXTAUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# API Key for n8n integration
API_KEY=

# Email
EMAIL_USER=
EMAIL_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Development Guidelines

1. **Always use TypeScript** - No JavaScript files
2. **Follow Next.js App Router patterns** - Use server components when possible
3. **Implement proper error handling** - Use try-catch blocks and proper HTTP status codes
4. **Validate all inputs** - Both client and server-side validation
5. **Use proper TypeScript interfaces** - Define clear data structures
6. **Implement proper loading states** - Use skeletons and loading indicators
7. **Follow internationalization patterns** - All user-facing text must be translatable
8. **Use proper authentication checks** - Protect routes and API endpoints
9. **Implement proper error boundaries** - Handle React errors gracefully
10. **Follow MongoDB best practices** - Use proper indexing and validation

## Common Patterns

### Server Actions
```typescript
'use server';

export async function actionName(params: Type) {
  try {
    // Validation
    // Database operations
    // Return success response
  } catch (error) {
    // Error handling
    return { error: 'Error message' };
  }
}
```

### API Routes
```typescript
export async function GET(req: Request) {
  try {
    // Handle GET request
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error message' }, { status: 500 });
  }
}
```

### Database Operations
```typescript
await connectDb();
const result = await Model.find(query).lean();
```

## Security Considerations

1. **Password Hashing** - Use bcrypt for password hashing
2. **JWT Tokens** - Use secure JWT tokens for authentication
3. **Input Validation** - Validate all user inputs
4. **Rate Limiting** - Implement rate limiting for API endpoints
5. **CORS** - Configure proper CORS settings
6. **Environment Variables** - Never expose sensitive data
7. **Email Verification** - Require email verification for accounts
8. **Password Reset** - Use secure token-based password reset

## Performance Considerations

1. **Image Optimization** - Use Cloudinary for image optimization
2. **Database Indexing** - Proper database indexes for queries
3. **Pagination** - Implement pagination for large datasets
4. **Caching** - Use appropriate caching strategies
5. **Code Splitting** - Implement code splitting for better performance
6. **SEO Optimization** - Proper meta tags and structured data

## Documentation References

The following documentation files provide detailed information about specific features and implementations:

### Core System Documentation
- **ARTICLES_FLOW_DOCUMENTATION.md** - Complete articles system implementation including server actions, API routes, data flows, and article creation with image upload
- **EMAIL_API_DOCUMENTATION.md** - Comprehensive email system documentation including all 19 API endpoints, server actions, email flows, and user/subscriber management
- **SERVER_ACTIONS_ARCHITECTURE.md** - Next.js server actions architecture pattern, implementation examples, and complete API structure overview
- **MULTILINGUAL_METADATA.md** - Multilingual metadata handling and SEO optimization strategies
- **PAGINATION_IMPLEMENTATION.md** - Pagination system implementation for articles and content
- **USER_MANAGEMENT_SYSTEM.md** - Complete user system implementation including server actions, API routes, data flows, and user creation with image upload
- **SUBSCRIBER_SYSTEM_DOCUMENTATION.md** - Complete subscriber system implementation including newsletter subscription flow, email verification, preference management, unsubscription, and newsletter distribution
- **COMMENT_SYSTEM_DOCUMENTATION.md** - Complete comment system implementation including separated architecture, server actions, API routes, user interactions, and moderation features

### Development & Testing
- **socialMedia.md** - Social media integration and sharing features

## Architecture Overview

The application follows a **Server Actions + API Routes** architecture pattern:

### Server Actions Structure
```
app/actions/
├── article/          # Article-related actions (6 actions)
├── auth/             # Authentication actions (4 actions)
├── newsletter/       # Newsletter actions (1 action)
├── subscribers/      # Subscriber management actions (6 actions)
├── user/             # User-related actions (1 action)
└── comment/          # Comment management actions (5 actions)
```

### API Routes Structure
```
app/api/v1/
├── articles/         # Article endpoints (4 endpoints)
├── auth/            # Authentication endpoints (5 endpoints)
├── newsletter/      # Newsletter endpoints (1 endpoint)
├── subscribers/     # Subscriber endpoints (8 endpoints)
├── users/          # User endpoints (6 endpoints)
└── comments/       # Comment endpoints (6 endpoints)
```

**Total API Endpoints: 30** (24 email/user/subscriber/article management + 6 comment endpoints)

## Future Documentation

This context file will be expanded with separate documentation for each main feature as the application grows. Current features are documented above, and new features will be added as separate sections.
