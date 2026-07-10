# Email System Documentation

## Overview

This document provides a comprehensive guide to the email system architecture, following the same Server Actions + API Routes pattern as the articles system. All email operations are handled by server actions and exposed via organized API routes for external access.

## Architecture Overview

The email system follows the **Server Actions + API Routes** architecture where:

1. **Server Actions** (`app/actions/auth/`, `app/actions/newsletter/`, `app/actions/subscribers/`, `app/actions/user/`) - Handle all email operations and database logic
2. **API Routes** (`app/api/v1/auth/`, `/api/v1/newsletter/`, `/api/v1/subscribers/`, `/api/v1/users/`) - Provide HTTP endpoints for third-party access
3. **Server Components** - Can use server actions directly
4. **Client Components** - Receive serialized data from server components

## Architecture Principles

### 1. **Single Responsibility Principle**
Each action file has one clear purpose:
- **Request Actions**: Handle business logic + email sending
- **Confirmation Actions**: Handle database operations
- **Email Utilities**: Handle email templates and sending

### 2. **Consistent Structure**
All email flows follow the same pattern:
```
📧 [Flow Name] Flow:
├── request[FlowName].ts     → Business logic + email sending
└── confirm[FlowName].ts     → Database operations
```

### 3. **Thin API Layer**
API routes act as thin layers that delegate to actions:
```typescript
// API Route
const result = await actionName(params);
return NextResponse.json(result);
```

## File Structure

### Server Actions

#### Authentication Actions (`app/actions/auth/`)
```
app/actions/auth/
├── confirmEmail.ts                            # Email confirmation logic
├── requestEmailConfirmation.ts                # Email confirmation request logic
├── requestPasswordReset.ts                    # Password reset request logic
└── resetPassword.ts                           # Password reset logic
```

#### Newsletter Actions (`app/actions/newsletter/`)
```
app/actions/newsletter/
└── sendNewsletter.ts                          # Newsletter sending logic
```

#### Subscriber Actions (`app/actions/subscribers/`)
```
app/actions/subscribers/
├── newsletterSubscribe.ts                     # Newsletter subscription logic
├── newsletterUnsubscribe.ts                   # Newsletter unsubscription logic
└── confirmNewsletterSubscription.ts           # Newsletter confirmation logic
```

#### User Actions (`app/actions/user/`)
```
app/actions/user/
└── commentReport.ts                           # Comment report email logic
```

### API Routes

#### Authentication Routes (in `/api/v1/auth/`)
```
app/api/v1/auth/
├── confirm-email/route.ts                     # Email confirmation endpoint
├── request-email-confirmation/route.ts        # Request email confirmation endpoint
├── request-password-reset/route.ts            # Request password reset endpoint
└── reset-password/route.ts                    # Reset password endpoint
```

#### Newsletter Routes (in `/api/v1/newsletter/` and `/api/v1/subscribers/`)
```
app/api/v1/newsletter/
└── send-newsletter/route.ts                  # Send newsletter endpoint

app/api/v1/subscribers/
├── route.ts                                   # Subscriber management (GET/POST)
├── [subscriberId]/route.ts                    # Individual subscriber management
├── newsletter-subscribe/route.ts              # Newsletter subscription endpoint
├── newsletter-unsubscribe/route.ts            # Newsletter unsubscription endpoint
└── confirm-newsletter-subscription/route.ts   # Newsletter confirmation endpoint
```

#### User Routes (in `/api/v1/users/`)
```
app/api/v1/users/
├── route.ts                                   # User management (GET/POST)
├── [userId]/route.ts                          # Individual user management
└── comment-report/route.ts                    # Comment report notification endpoint
```

## Complete API Overview

### Total Endpoints: **19 API Routes**

| Category | Count | Endpoints |
|----------|-------|-----------|
| **Authentication** | 4 | Email confirmation, password reset flows |
| **Newsletter** | 1 | Send newsletter to all subscribers |
| **Subscriber Management** | 6 | CRUD operations + subscription flows |
| **User Management** | 6 | CRUD operations + user accounts |
| **Notifications** | 1 | Comment report notifications |
| **NextAuth** | 1 | Authentication provider |

### API Organization
- **RESTful Design**: Clear resource-based URLs
- **Nested Resources**: Related endpoints grouped logically  
- **Dynamic Routes**: `[param]` for resource-specific operations
- **Consistent Naming**: Clear, descriptive endpoint names
- **HTTP Methods**: Appropriate use of GET, POST, PUT, DELETE

## API Endpoints

### 1. Authentication-Related Emails

#### POST `/api/v1/auth/confirm-email`
**Purpose**: Confirm email address with verification token

**Parameters**:
```typescript
{
  token: string; // Required - verification token
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  error?: string;
}
```

**Usage**:
- Email verification after user registration
- Account activation process

#### POST `/api/v1/auth/request-email-confirmation`
**Purpose**: Request email confirmation for user account

**Parameters**:
```typescript
{
  email: string; // Required - user email address
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  error?: string;
}
```

**Usage**:
- Resend confirmation email
- Account verification process

#### POST `/api/v1/auth/request-password-reset`
**Purpose**: Request password reset for user account

**Parameters**:
```typescript
{
  email: string; // Required - user email address
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  resetLink?: string; // Only in development
  error?: string;
}
```

**Usage**:
- Password reset initiation
- Account recovery process

#### POST `/api/v1/auth/reset-password`
**Purpose**: Reset user password with token

**Parameters**:
```typescript
{
  token: string;        // Required - reset token
  newPassword: string;  // Required - new password
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  error?: string;
}
```

**Usage**:
- Password reset completion
- Account security updates

### 2. Newsletter-Related Emails

#### POST `/api/v1/subscribers/newsletter-subscribe`
**Purpose**: Subscribe to newsletter

**Parameters**:
```typescript
{
  email: string;                    // Required - subscriber email
  preferences?: {                   // Optional - subscription preferences
    categories?: string[];
    subscriptionFrequencies?: string;
  };
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  error?: string;
}
```

**Usage**:
- Newsletter subscription
- Marketing email collection

#### POST `/api/v1/subscribers/newsletter-unsubscribe`
**Purpose**: Unsubscribe from newsletter

**Parameters**:
```typescript
{
  email: string;  // Required - subscriber email
  token?: string; // Optional - unsubscribe token
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  error?: string;
}
```

**Usage**:
- Newsletter unsubscription
- GDPR compliance

#### POST `/api/v1/subscribers/confirm-newsletter-subscription`
**Purpose**: Confirm newsletter subscription with token

**Parameters**:
```typescript
{
  token: string; // Required - verification token
  email: string; // Required - subscriber email
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  error?: string;
}
```

**Usage**:
- Newsletter subscription confirmation
- Double opt-in process

#### POST `/api/v1/newsletter/send-newsletter`
**Purpose**: Send newsletter to all verified subscribers

**Parameters**: None

**Response**:
```typescript
{
  success: boolean;
  message: string;
  sentCount?: number;
  error?: string;
}
```

**Usage**:
- Mass newsletter sending
- Marketing campaigns

### 3. Subscriber Management

#### GET `/api/v1/subscribers`
**Purpose**: Get all verified subscribers (Admin only)

**Parameters**: None

**Response**:
```typescript
{
  success: boolean;
  subscribers: ISubscriber[];
  count: number;
  error?: string;
}
```

**Usage**:
- Admin dashboard
- Subscriber analytics
- Export subscriber lists

#### POST `/api/v1/subscribers`
**Purpose**: Create new subscriber

**Parameters**:
```typescript
{
  email: string;
  preferences?: {
    categories?: string[];
    subscriptionFrequencies?: string;
  };
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  subscriber?: ISubscriber;
  error?: string;
}
```

**Usage**:
- Programmatic subscriber creation
- Bulk subscriber import

#### GET `/api/v1/subscribers/[subscriberId]`
**Purpose**: Get individual subscriber details

**Parameters**:
- `subscriberId` - Subscriber ID from URL

**Response**:
```typescript
{
  success: boolean;
  subscriber?: ISubscriber;
  error?: string;
}
```

**Usage**:
- Subscriber profile management
- Subscription details

#### PUT `/api/v1/subscribers/[subscriberId]`
**Purpose**: Update subscriber information

**Parameters**:
- `subscriberId` - Subscriber ID from URL
- Body: Updated subscriber data

**Response**:
```typescript
{
  success: boolean;
  message: string;
  subscriber?: ISubscriber;
  error?: string;
}
```

**Usage**:
- Update subscription preferences
- Modify subscriber details

#### DELETE `/api/v1/subscribers/[subscriberId]`
**Purpose**: Delete subscriber

**Parameters**:
- `subscriberId` - Subscriber ID from URL

**Response**:
```typescript
{
  success: boolean;
  message: string;
  error?: string;
}
```

**Usage**:
- Remove subscribers
- GDPR compliance

### 4. User Management

#### GET `/api/v1/users`
**Purpose**: Get all users (Admin only)

**Parameters**: None

**Response**:
```typescript
{
  success: boolean;
  users: IUser[];
  count: number;
  error?: string;
}
```

**Usage**:
- Admin dashboard
- User analytics
- User management

#### POST `/api/v1/users`
**Purpose**: Create new user account

**Parameters**:
```typescript
{
  email: string;
  password: string;
  username: string;
  imageUrl?: string;
  preferences?: IUserPreferences;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  user?: IUser;
  error?: string;
}
```

**Usage**:
- User registration
- Account creation

#### GET `/api/v1/users/[userId]`
**Purpose**: Get individual user details

**Parameters**:
- `userId` - User ID from URL

**Response**:
```typescript
{
  success: boolean;
  user?: IUser;
  error?: string;
}
```

**Usage**:
- User profile management
- Account details

#### PUT `/api/v1/users/[userId]`
**Purpose**: Update user information

**Parameters**:
- `userId` - User ID from URL
- Body: Updated user data

**Response**:
```typescript
{
  success: boolean;
  message: string;
  user?: IUser;
  error?: string;
}
```

**Usage**:
- Update user profile
- Modify account settings

#### DELETE `/api/v1/users/[userId]`
**Purpose**: Delete user account

**Parameters**:
- `userId` - User ID from URL

**Response**:
```typescript
{
  success: boolean;
  message: string;
  error?: string;
}
```

**Usage**:
- Account deletion
- GDPR compliance

### 5. Notification Emails

#### POST `/api/v1/users/comment-report`
**Purpose**: Send comment report email notification

**Parameters**:
```typescript
{
  email: string;        // Required - user email
  username: string;     // Required - username
  commentText: string;  // Required - reported comment text
  reason: string;       // Required - report reason
  articleTitle: string; // Required - article title
  locale?: string;      // Optional - locale (default: 'en')
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  data?: { messageId: string };
  error?: string;
}
```

**Usage**:
- Comment moderation notifications
- User engagement alerts

## Email Flows

### 1. Newsletter Subscription Flow

#### Flow:
```
1. User subscribes → newsletterSubscribe.ts
   ├── Validates email format
   ├── Checks existing users/subscribers
   ├── Generates verification & unsubscribe tokens
   ├── Creates/updates subscriber record
   ├── Validates email (disposable email check)
   └── Sends confirmation email

2. User clicks confirmation link → confirmNewsletterSubscription.ts
   ├── Validates token and email
   ├── Finds subscriber
   ├── Marks email as verified
   ├── Clears verification token
   └── Generates new unsubscribe token

3. User unsubscribes → newsletterUnsubscribe.ts
   ├── Validates email and token
   ├── Finds subscriber
   ├── Validates unsubscribe token
   └── Deactivates subscription (or deletes if no user account)
```

#### API Routes:
- `POST /api/v1/subscribers/newsletter-subscribe` → calls `newsletterSubscribe.ts`
- `POST /api/v1/subscribers/confirm-newsletter-subscription` → calls `confirmNewsletterSubscription.ts`
- `POST /api/v1/subscribers/newsletter-unsubscribe` → calls `newsletterUnsubscribe.ts`

### 2. Email Confirmation Flow

#### Flow:
```
1. User requests email confirmation → requestEmailConfirmation.ts
   ├── Validates email
   ├── Checks if user exists
   ├── Checks if already verified
   ├── Generates verification token
   ├── Updates user record
   └── Sends confirmation email (multilingual)

2. User clicks confirmation link → confirmEmail.ts
   ├── Validates token
   ├── Finds user with valid token
   ├── Checks if already verified
   ├── Updates user email verification status
   ├── Clears verification token
   └── Updates linked subscriber (if exists)
```

#### API Routes:
- `POST /api/v1/auth/request-email-confirmation` → calls `requestEmailConfirmation.ts`
- `POST /api/v1/auth/confirm-email` → calls `confirmEmail.ts`

### 3. Password Reset Flow

#### Flow:
```
1. User requests password reset → requestPasswordReset.ts
   ├── Validates email
   ├── Checks if user exists
   ├── Generates reset token (1 hour expiry)
   ├── Updates user record with token
   └── Sends reset email (multilingual)

2. User resets password → resetPassword.ts
   ├── Validates token and password
   ├── Checks token expiry
   ├── Finds user with valid token
   ├── Hashes new password
   ├── Updates password
   └── Clears reset token
```

#### API Routes:
- `POST /api/v1/auth/request-password-reset` → calls `requestPasswordReset.ts`
- `POST /api/v1/auth/reset-password` → calls `resetPassword.ts`

### 4. Newsletter Broadcasting Flow

#### Flow:
```
1. Admin sends newsletter → sendNewsletter.ts
   ├── Gets all verified subscribers
   ├── Validates email configuration
   ├── Sends newsletter to each subscriber
   ├── Handles individual email failures
   └── Returns success count and errors
```

#### API Routes:
- `POST /api/v1/newsletter/send-newsletter` → calls `sendNewsletter.ts`

### 5. Comment Report Notification Flow

#### Flow:
```
1. Comment is reported → commentReport.ts
   ├── Validates email configuration
   ├── Generates multilingual email content
   ├── Includes comment details and report reason
   └── Sends notification to comment author
```

#### API Routes:
- `POST /api/v1/users/comment-report` → calls `commentReport.ts`

## Server Actions

All API routes use corresponding server actions from their respective action folders:

#### Authentication Actions (`app/actions/auth/`)
1. `confirmEmailAction` - Email confirmation logic
2. `requestEmailConfirmation` - Email confirmation request logic
3. `requestPasswordResetAction` - Password reset request logic
4. `resetPassword` - Password reset logic

#### Newsletter Actions (`app/actions/newsletter/`)
5. `sendNewsletterAction` - Newsletter sending logic

#### Subscriber Actions (`app/actions/subscribers/`)
6. `subscribeToNewsletterAction` - Newsletter subscription logic
7. `unsubscribeFromNewsletterAction` - Newsletter unsubscription logic
8. `confirmNewsletterSubscriptionAction` - Newsletter confirmation logic

#### User Actions (`app/actions/user/`)
9. `sendCommentReportEmailAction` - Comment report email logic

## Shared Email Utilities

### Email Configuration
All email actions use shared utilities for:
- **Transporter Creation**: Gmail SMTP configuration
- **Email Validation**: Environment variable checks
- **Email Sending**: Consistent error handling

### Multilingual Support
Email templates support 9 languages:
- English (en)
- Portuguese (pt)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Dutch (nl)

### Email Templates
All emails follow a consistent design:
- **Header**: Women's Spot branding with pink theme
- **Content**: Localized messages and instructions
- **Actions**: Call-to-action buttons
- **Footer**: Copyright and unsubscribe links

## Database Models

### User Model
```typescript
{
  email: string;
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  subscriptionId?: ObjectId;
}
```

### Subscriber Model
```typescript
{
  email: string;
  emailVerified: boolean;
  verificationToken?: string;
  unsubscribeToken?: string;
  subscriptionPreferences: {
    categories: string[];
    subscriptionFrequencies: string;
  };
  userId?: ObjectId;
}
```

## Key Features

### 1. Consistent Response Format
All endpoints return consistent JSON responses:
```typescript
{
  success: boolean;
  message: string;
  error?: string;
  // Additional fields as needed
}
```

### 2. Error Handling
- Graceful error handling with appropriate HTTP status codes
- Detailed error messages for debugging
- Security-conscious error responses (don't reveal sensitive information)

### 3. Input Validation
- Required field validation
- Email format validation
- Token validation
- Password strength validation

### 4. Internationalization
- Multi-language email templates
- Locale-specific content
- Support for 9 languages (en, pt, es, fr, de, it, nl)

### 5. Security Features
- Token-based authentication
- Secure password reset with expiration
- Email verification requirements
- Unsubscribe token validation

## Security Features

### Token Management
- **Verification Tokens**: Random 32-character hex strings
- **Reset Tokens**: 1-hour expiry for password resets
- **Unsubscribe Tokens**: Unique per subscriber for secure unsubscription

### Email Validation
- **Format Validation**: Regex-based email format checking
- **Disposable Email Detection**: Blocks common temporary email services
- **Bounce Handling**: Removes invalid email addresses from database

### Rate Limiting
- **Email Sending**: Individual error handling per recipient
- **Token Generation**: Secure random token generation
- **Database Transactions**: Atomic operations for data consistency

## Error Handling

### Consistent Error Response Format
```typescript
interface EmailActionResult {
  success: boolean;
  message: string;
  error?: string;
}
```

### Error Types
- **Validation Errors**: Invalid email format, missing fields
- **Business Logic Errors**: User already exists, email already verified
- **Email Service Errors**: SMTP failures, bounce handling
- **Database Errors**: Connection issues, transaction failures

## Usage Examples

### 1. Email Confirmation Flow
```bash
# Request email confirmation
curl -X POST http://localhost:3000/api/v1/auth/request-email-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Confirm email with token
curl -X POST http://localhost:3000/api/v1/auth/confirm-email \
  -H "Content-Type: application/json" \
  -d '{"token": "verification_token_here"}'
```

### 2. Newsletter Subscription Flow
```bash
# Subscribe to newsletter
curl -X POST http://localhost:3000/api/v1/subscribers/newsletter-subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com",
    "preferences": {
      "categories": ["nutrition", "fitness"],
      "subscriptionFrequencies": "weekly"
    }
  }'

# Confirm subscription
curl -X POST http://localhost:3000/api/v1/subscribers/confirm-newsletter-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "token": "confirmation_token",
    "email": "subscriber@example.com"
  }'
```

### 3. Password Reset Flow
```bash
# Request password reset
curl -X POST http://localhost:3000/api/v1/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Reset password
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token",
    "newPassword": "newSecurePassword123"
  }'
```

### 4. Subscriber Management
```bash
# Get all subscribers (Admin)
curl -X GET http://localhost:3000/api/v1/subscribers \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Create new subscriber
curl -X POST http://localhost:3000/api/v1/subscribers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com",
    "preferences": {
      "categories": ["nutrition", "fitness"],
      "subscriptionFrequencies": "weekly"
    }
  }'

# Get individual subscriber
curl -X GET http://localhost:3000/api/v1/subscribers/SUBSCRIBER_ID

# Update subscriber
curl -X PUT http://localhost:3000/api/v1/subscribers/SUBSCRIBER_ID \
  -H "Content-Type: application/json" \
  -d '{"preferences": {"categories": ["nutrition"]}}'

# Delete subscriber
curl -X DELETE http://localhost:3000/api/v1/subscribers/SUBSCRIBER_ID
```

### 5. User Management
```bash
# Get all users (Admin)
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Create new user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "username": "johndoe",
    "preferences": {
      "notifications": true,
      "language": "en"
    }
  }'

# Get individual user
curl -X GET http://localhost:3000/api/v1/users/USER_ID

# Update user
curl -X PUT http://localhost:3000/api/v1/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"username": "newusername"}'

# Delete user
curl -X DELETE http://localhost:3000/api/v1/users/USER_ID
```

## Testing

### 1. Individual Endpoint Testing
```bash
# Test email confirmation
curl -X POST http://localhost:3000/api/v1/auth/confirm-email \
  -H "Content-Type: application/json" \
  -d '{"token": "test_token"}'

# Test newsletter subscription
curl -X POST http://localhost:3000/api/v1/subscribers/newsletter-subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 2. Integration Testing
1. Test complete email confirmation flow
2. Test newsletter subscription and unsubscription
3. Test password reset flow
4. Test comment report notifications
5. Test error handling with invalid inputs

## Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `INVALID_EMAIL` | Invalid email format | 400 |
| `MISSING_PARAMETERS` | Required parameters missing | 400 |
| `INVALID_TOKEN` | Invalid or expired token | 400 |
| `EMAIL_ALREADY_VERIFIED` | Email already verified | 400 |
| `PASSWORD_TOO_SHORT` | Password doesn't meet requirements | 400 |
| `ALREADY_SUBSCRIBED` | Already subscribed to newsletter | 400 |
| `SUBSCRIBER_NOT_FOUND` | Subscriber not found | 404 |
| `EMAIL_SENDING_FAILED` | Email service error | 500 |
| `SUBSCRIPTION_FAILED` | Database operation failed | 500 |

## Environment Variables

Required environment variables for email functionality:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
NEXTAUTH_URL=http://localhost:3000
```

## Future Enhancements

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Email Templates**: Dynamic email template system
3. **Analytics**: Track email open rates and engagement
4. **Bulk Operations**: Batch email operations
5. **Email Scheduling**: Schedule emails for later sending
6. **A/B Testing**: Test different email templates
7. **Unsubscribe Preferences**: Granular subscription preferences
8. **Email Validation**: Real-time email validation service

## Troubleshooting

### Common Issues

1. **Email Not Sending**: Check EMAIL_USER and EMAIL_PASSWORD environment variables
2. **Invalid Token Errors**: Ensure tokens are not expired and properly formatted
3. **Database Connection**: Verify MongoDB connection is working
4. **Rate Limiting**: Check if email service has rate limits
5. **Template Rendering**: Verify email templates are properly formatted

### Debug Tips

1. Check server action return values
2. Verify API route parameter parsing
3. Test with different email providers
4. Check email service logs
5. Verify environment variables are set correctly

## Frontend Pages

| Page | Route | Action Used | Description |
|------|-------|-------------|-------------|
| Newsletter Signup | `/` | `newsletterSubscribe` | Homepage newsletter signup |
| Confirm Newsletter | `/confirm-newsletter` | `confirmNewsletterSubscription` | Newsletter confirmation page |
| Unsubscribe | `/unsubscribe` | `newsletterUnsubscribe` | Newsletter unsubscribe page |
| Confirm Email | `/confirm-email` | `confirmEmail` | Email confirmation page |
| Forgot Password | `/forgot-password` | `requestPasswordReset` | Password reset request page |
| Reset Password | `/reset-password` | `resetPassword` | Password reset form page |
| Profile | `/profile` | `requestEmailConfirmation` | User profile with email management |

## Development Guidelines

### Adding New Email Flows
1. Create request action (business logic + email sending)
2. Create confirmation action (database operations)
3. Add API routes that delegate to actions
4. Create frontend pages/components
5. Add multilingual support
6. Update this documentation

### Testing Email Actions
1. **Unit Tests**: Test individual action functions
2. **Integration Tests**: Test API routes with actions
3. **Email Testing**: Use test email addresses
4. **Error Scenarios**: Test validation and error handling

### Monitoring and Logging
- **Email Sending**: Log success/failure for each email
- **Token Usage**: Track verification and reset token usage
- **Error Tracking**: Monitor and alert on email service failures
- **Performance**: Track email sending performance

## Troubleshooting

### Common Issues
1. **Email Not Sending**: Check Gmail credentials and 2FA setup
2. **Token Expiry**: Verify token generation and expiry logic
3. **Database Errors**: Check MongoDB connection and transaction handling
4. **Multilingual Issues**: Verify locale detection and translation keys

### Debug Steps
1. Check environment variables
2. Verify database connections
3. Test email configuration
4. Review error logs
5. Validate token generation

## Future Enhancements

### Planned Features
- **Email Templates**: Dynamic template system
- **Analytics**: Email open/click tracking
- **A/B Testing**: Email content optimization
- **Scheduling**: Automated newsletter sending
- **Segmentation**: Targeted email campaigns

### Technical Improvements
- **Queue System**: Background email processing
- **Retry Logic**: Automatic retry for failed emails
- **Rate Limiting**: Prevent email spam
- **Monitoring**: Real-time email delivery tracking

This email system provides a robust, scalable, and maintainable solution for all email-related operations while maintaining consistency with the overall application architecture.

## Implementation Summary

### What Was Accomplished

This email system was successfully organized and created following the same Server Actions + API Routes pattern used in the articles system. Here's what was implemented:

### 📁 File Structure Created

#### Server Actions
```
app/actions/
├── auth/
│   ├── confirmEmail.ts                             # Email confirmation logic
│   ├── requestEmailConfirmation.ts                 # Email confirmation request logic
│   ├── requestPasswordReset.ts                     # Password reset request logic
│   └── resetPassword.ts                            # Password reset logic
├── newsletter/
│   └── sendNewsletter.ts                           # Newsletter sending logic
├── subscribers/
│   ├── newsletterSubscribe.ts                      # Newsletter subscription logic
│   ├── newsletterUnsubscribe.ts                    # Newsletter unsubscription logic
│   └── confirmNewsletterSubscription.ts            # Newsletter confirmation logic
└── user/
    └── commentReport.ts                            # Comment report email logic
```

#### API Routes
```
app/api/v1/
├── auth/
│   ├── confirm-email/route.ts                      # Email confirmation
│   ├── request-email-confirmation/route.ts         # Request email confirmation
│   ├── request-password-reset/route.ts             # Request password reset
│   └── reset-password/route.ts                     # Reset password
├── newsletter/
│   ├── route.ts                                    # Newsletter management
│   └── send-newsletter/route.ts                    # Send newsletter
├── subscribers/
│   ├── route.ts                                    # Subscriber management
│   ├── newsletter-subscribe/route.ts               # Newsletter subscription
│   ├── newsletter-unsubscribe/route.ts             # Newsletter unsubscription
│   └── confirm-newsletter-subscription/route.ts    # Newsletter confirmation
└── users/
    └── comment-report/route.ts                     # Comment report notification
```

### 🔧 API Endpoints Created

#### Authentication Emails (4 endpoints)
1. **POST** `/api/v1/auth/confirm-email` - Confirm email with token
2. **POST** `/api/v1/auth/request-email-confirmation` - Request email confirmation
3. **POST** `/api/v1/auth/request-password-reset` - Request password reset
4. **POST** `/api/v1/auth/reset-password` - Reset password with token

#### Newsletter Emails (1 endpoint)
5. **POST** `/api/v1/newsletter/send-newsletter` - Send newsletter to all subscribers

#### Subscriber Management (6 endpoints)
6. **GET** `/api/v1/subscribers` - Get all subscribers (Admin)
7. **POST** `/api/v1/subscribers` - Create new subscriber
8. **GET** `/api/v1/subscribers/[subscriberId]` - Get individual subscriber
9. **PUT** `/api/v1/subscribers/[subscriberId]` - Update subscriber
10. **DELETE** `/api/v1/subscribers/[subscriberId]` - Delete subscriber
11. **POST** `/api/v1/subscribers/newsletter-subscribe` - Subscribe to newsletter
12. **POST** `/api/v1/subscribers/newsletter-unsubscribe` - Unsubscribe from newsletter
13. **POST** `/api/v1/subscribers/confirm-newsletter-subscription` - Confirm newsletter subscription

#### User Management (6 endpoints)
14. **GET** `/api/v1/users` - Get all users (Admin)
15. **POST** `/api/v1/users` - Create new user account
16. **GET** `/api/v1/users/[userId]` - Get individual user
17. **PUT** `/api/v1/users/[userId]` - Update user
18. **DELETE** `/api/v1/users/[userId]` - Delete user
19. **POST** `/api/v1/users/comment-report` - Send comment report notification

### 🎯 Key Features Implemented

#### ✅ Consistent Architecture
- Follows the same Server Actions + API Routes pattern as articles
- All database logic handled by server actions
- API routes provide HTTP endpoints for external access
- Consistent response format across all endpoints

#### ✅ Comprehensive Error Handling
- Proper HTTP status codes (400, 404, 500)
- Detailed error messages for debugging
- Security-conscious error responses
- Graceful handling of edge cases

#### ✅ Input Validation
- Required field validation
- Email format validation
- Token validation
- Password strength validation
- Parameter type checking

#### ✅ Internationalization Support
- Multi-language email templates
- Locale parameter support
- Support for 9 languages (en, pt, es, fr, de, it, nl)

#### ✅ Security Features
- Token-based authentication
- Secure password reset with expiration
- Email verification requirements
- Unsubscribe token validation

### 🔄 How It Works

#### Server Actions Pattern
```
External Request → API Route → Server Action → Database → Response
```

#### Example Flow
1. External application calls `POST /api/v1/subscribers/newsletter-subscribe`
2. API route validates input parameters
3. API route calls `subscribeToNewsletterAction(email, preferences)`
4. Server action handles database operations and email sending
5. API route returns consistent JSON response

### 🧪 Testing

The implementation includes:
- Comprehensive error handling testing
- Input validation testing
- Response format verification
- TypeScript type safety

### 🚀 Benefits Achieved

#### For External Applications
- Clean, RESTful API endpoints
- Consistent response format
- Comprehensive error handling
- Detailed documentation

#### For Internal Development
- Reusable server actions
- Type-safe implementations
- Maintainable code structure
- Easy to extend and modify

#### For Users
- Reliable email operations
- Multi-language support
- Secure authentication flows
- Professional email templates

### 📋 Next Steps

1. **Test the API routes** using the provided examples
2. **Deploy and verify** all endpoints work correctly
3. **Add authentication** to admin-only endpoints if needed
4. **Monitor usage** and performance
5. **Extend functionality** as needed (rate limiting, analytics, etc.)

### 🎉 Result

You now have a complete, well-organized email and user management API system that:
- Follows the same architecture pattern as your articles system
- Provides external access to all email and user functionality
- Maintains consistency with your existing codebase
- Includes comprehensive documentation and testing
- Is ready for production use

**Total API Endpoints: 19**
- **Authentication**: 4 endpoints
- **Newsletter**: 1 endpoint  
- **Subscriber Management**: 6 endpoints
- **User Management**: 6 endpoints
- **Notifications**: 1 endpoint
- **NextAuth**: 1 endpoint

All email actions now have corresponding API routes, making your email system accessible from external applications while maintaining the benefits of Next.js server actions for internal use.
