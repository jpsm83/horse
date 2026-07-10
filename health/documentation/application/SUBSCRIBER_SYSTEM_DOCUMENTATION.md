# Subscriber System Documentation

## Overview

The Subscriber System manages newsletter subscriptions for the Women's Spot health blog platform. It handles the complete subscription lifecycle from initial signup to unsubscription, including email verification, preference management, and newsletter distribution.

## Architecture

The subscriber system follows the **Server Actions + API Routes** architecture pattern:

- **Server Actions** (`app/actions/subscribers/`): Handle all database operations and business logic
- **API Routes** (`app/api/v1/subscribers/`): Provide HTTP endpoints for external applications
- **Models** (`app/api/models/subscriber.ts`): Define the subscriber data structure

## Database Schema

### Subscriber Model
```typescript
interface ISubscriber {
  _id?: Types.ObjectId;
  email: string;                    // Unique email address (lowercase)
  emailVerified: boolean;           // Verification status (status property, not filter)
  verificationToken?: string;       // Token for email confirmation
  unsubscribeToken: string;         // Token for unsubscription
  userId?: Types.ObjectId;          // Reference to User model (if linked)
  subscriptionPreferences: {
    categories: string[];           // Preferred content categories
    subscriptionFrequencies: string; // Newsletter frequency (daily/weekly/monthly)
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Core Features

### 1. Newsletter Subscription Flow

#### 1.1 Initial Subscription
- **Action**: `newsletterSubscribe.ts`
- **API Route**: `POST /api/v1/subscribers` or `POST /api/v1/subscribers/newsletter-subscribe`
- **Process**:
  1. Validate email format
  2. Check if user account exists (prevent duplicate subscriptions)
  3. Create new subscriber or update existing one
  4. Generate verification token
  5. Send confirmation email
  6. Return success response

#### 1.2 Email Confirmation
- **Action**: `confirmNewsletterSubscription.ts`
- **API Route**: `POST /api/v1/subscribers/confirm-newsletter-subscription`
- **Process**:
  1. Validate token and email
  2. Find subscriber by email and token
  3. Mark email as verified
  4. Clear verification token
  5. Generate new unsubscribe token
  6. Return confirmation success

### 2. Subscriber Management

#### 2.1 Get All Subscribers
- **Action**: `getSubscribers.ts`
- **API Route**: `GET /api/v1/subscribers`
- **Access**: Admin only
- **Returns**: All subscribers (regardless of verification status)
- **Note**: `emailVerified` is included in response but not used as filter

#### 2.2 Get Subscriber by ID
- **Action**: `getSubscriberById.ts`
- **API Route**: `GET /api/v1/subscribers/[subscriberId]`
- **Access**: Private
- **Process**:
  1. Validate ObjectId format
  2. Find subscriber by ID
  3. Serialize and return subscriber data

#### 2.3 Update Subscriber Preferences
- **Action**: `updateSubscriberPreferences.ts`
- **API Route**: `PATCH /api/v1/subscribers/[subscriberId]`
- **Access**: Private (subscriber must own the subscription)
- **Process**:
  1. Validate ObjectId and session
  2. Check authorization (subscriber must belong to authenticated user)
  3. Validate subscription preferences
  4. Update preferences in database
  5. Return updated subscriber data

### 3. Unsubscription Flow

#### 3.1 Unsubscribe from Newsletter
- **Action**: `newsletterUnsubscribe.ts`
- **API Route**: `DELETE /api/v1/subscribers` or `POST /api/v1/subscribers/newsletter-unsubscribe`
- **Process**:
  1. Find subscriber by email
  2. Validate unsubscribe token (if provided)
  3. Check if subscriber has linked user account:
     - **With User Account**: Deactivate subscription (`emailVerified = false`)
     - **Without User Account**: Delete subscriber record completely
  4. Return unsubscription success

### 4. Newsletter Distribution

#### 4.1 Send Newsletter
- **Action**: `sendNewsletter.ts`
- **API Route**: `POST /api/v1/newsletter/send-newsletter`
- **Access**: Admin only
- **Process**:
  1. Get all subscribers (no filtering by verification status)
  2. Validate email configuration
  3. Send newsletter to each subscriber
  4. Track success/failure counts
  5. Return distribution results

## Key Principles

### 1. Email Verification Status
- **`emailVerified` is a status property, not a filter criterion**
- All queries return subscribers regardless of verification status
- Verification status is used for business logic, not data filtering
- Subscribers can receive newsletters regardless of verification status

### 2. Duplicate Prevention
- Users with existing accounts cannot subscribe to newsletter separately
- Existing subscribers can update preferences and resend confirmation
- Email addresses are normalized to lowercase for consistency

### 3. Data Retention
- Subscribers with linked user accounts are deactivated, not deleted
- Subscribers without user accounts are completely removed
- This preserves user data while respecting unsubscription requests

### 4. Security
- Verification tokens are generated securely
- Unsubscribe tokens are validated before processing
- Authorization checks ensure users can only modify their own subscriptions

## API Endpoints Summary

| Method | Endpoint | Action | Access | Description |
|--------|----------|--------|--------|-------------|
| GET | `/api/v1/subscribers` | `getSubscribers` | Admin | Get all subscribers |
| POST | `/api/v1/subscribers` | `newsletterSubscribe` | Public | Subscribe to newsletter |
| DELETE | `/api/v1/subscribers` | `newsletterUnsubscribe` | Public | Unsubscribe from newsletter |
| GET | `/api/v1/subscribers/[id]` | `getSubscriberById` | Private | Get subscriber by ID |
| PATCH | `/api/v1/subscribers/[id]` | `updateSubscriberPreferences` | Private | Update subscriber preferences |
| POST | `/api/v1/subscribers/newsletter-subscribe` | `newsletterSubscribe` | Public | Alternative subscribe endpoint |
| POST | `/api/v1/subscribers/newsletter-unsubscribe` | `newsletterUnsubscribe` | Public | Alternative unsubscribe endpoint |
| POST | `/api/v1/subscribers/confirm-newsletter-subscription` | `confirmNewsletterSubscription` | Public | Confirm email subscription |
| POST | `/api/v1/newsletter/send-newsletter` | `sendNewsletter` | Admin | Send newsletter to all subscribers |

## Error Handling

### Common Error Codes
- `INVALID_EMAIL`: Invalid email format
- `USER_EXISTS`: Email already registered as user account
- `ALREADY_SUBSCRIBED`: Email already subscribed (removed in current implementation)
- `INVALID_EMAIL_ADDRESS`: Email validation failed
- `EMAIL_BOUNCED`: Email delivery failed
- `MISSING_PARAMETERS`: Required parameters missing
- `INVALID_TOKEN`: Invalid verification/unsubscribe token
- `SUBSCRIBER_NOT_FOUND`: Subscriber not found
- `NO_SUBSCRIBERS`: No subscribers found for newsletter

### Response Format
```typescript
interface ISubscriberResponse {
  success: boolean;
  data?: ISerializedSubscriber | ISerializedSubscriber[];
  message?: string;
  error?: string;
}
```

## Integration Points

### 1. User System Integration
- Subscribers can be linked to user accounts via `userId` field
- User email confirmation updates linked subscriber verification status
- User preferences can be managed through subscriber preference updates

### 2. Email System Integration
- Uses Nodemailer for email delivery
- Supports multilingual email templates
- Includes unsubscribe links in all emails

### 3. Content System Integration
- Subscriber preferences include content category preferences
- Newsletter content can be filtered based on subscriber preferences
- Supports multiple subscription frequencies

## Development Guidelines

### 1. Adding New Features
- Always create server actions first
- Follow existing error handling patterns
- Include proper TypeScript interfaces
- Add comprehensive validation

### 2. Database Operations
- Use server actions for all database operations
- Include proper error handling and validation
- Use transactions for multi-model operations
- Follow MongoDB best practices

### 3. API Design
- Keep API routes thin - delegate to server actions
- Use consistent response formats
- Include proper HTTP status codes
- Document all endpoints

## Future Enhancements

### Potential Improvements
1. **Analytics**: Track subscription metrics and engagement
2. **Segmentation**: Advanced subscriber segmentation based on preferences
3. **A/B Testing**: Test different newsletter formats and content
4. **Automation**: Automated newsletter scheduling and delivery
5. **Personalization**: Dynamic content based on subscriber behavior

### Scalability Considerations
1. **Pagination**: Implement pagination for large subscriber lists
2. **Caching**: Add caching for frequently accessed subscriber data
3. **Queue System**: Use message queues for newsletter delivery
4. **Rate Limiting**: Implement rate limiting for subscription endpoints

## Troubleshooting

### Common Issues
1. **Email Not Sending**: Check email configuration and SMTP settings
2. **Verification Links Not Working**: Verify token generation and URL construction
3. **Duplicate Subscriptions**: Check email normalization and duplicate prevention logic
4. **Authorization Errors**: Verify session handling and user ID matching

### Debugging Tips
1. Check server logs for detailed error messages
2. Verify database connections and query results
3. Test email delivery with different email providers
4. Validate token generation and verification logic
