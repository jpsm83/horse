# User Management System Documentation

## Overview

This document provides a comprehensive guide to the user management system architecture, including server actions, API routes, and the complete user flow. The system follows a **Server Actions + API Routes** architecture that provides both server-side rendering support and third-party API access.

## Architecture Overview

The user management system consists of:

1. **Server Actions** (`app/actions/user/`) - Handle all user database operations
2. **API Routes** (`app/api/v1/users/`) - Provide HTTP endpoints for third-party access
3. **Server Components** - Use server actions directly for data fetching
4. **Client Components** - Receive serialized data from server components
5. **Profile Management** - Complete user profile editing with language/region synchronization

## Current Status: ✅ COMPLETE IMPLEMENTATION

All user management features have been successfully implemented and are working correctly:

- ✅ **Server Actions**: Complete CRUD operations with enhanced features
- ✅ **API Routes**: Updated to use server actions for consistency
- ✅ **Profile Management**: Full profile editing with language/region sync
- ✅ **Authorization**: User can only update their own profile
- ✅ **Serialization**: Proper MongoDB object serialization for client components
- ✅ **Error Handling**: Comprehensive error handling and validation

## Server Actions

### 1. `getUsers.ts`
**Purpose**: Fetch all users with password exclusion

**Parameters**: None

**Returns**: `Promise<IUserResponse>`

**Usage**:
- Server components: Direct import and call
- API routes: Import and use in HTTP handlers
- Features: User management, admin panels

**Example**:
```typescript
const result = await getUsers();
if (result.success) {
  console.log(result.data); // Array of serialized users
}
```

### 2. `createUser.ts`
**Purpose**: Create new user with image upload and subscription linking

**Parameters**:
```typescript
interface ICreateUserParams {
  username: string;
  email: string;
  password: string;
  role: string;
  birthDate: string;
  language: string;
  region: string;
  imageFile?: File;
}
```

**Returns**: `Promise<ICreateUserResponse>`

**Usage**:
- Server components: User registration forms
- API routes: User creation endpoints
- Features: User registration, account creation

**Example**:
```typescript
const result = await createUser({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'SecurePass123!',
  role: 'user',
  birthDate: '1990-01-01',
  language: 'en',
  region: 'US',
  imageFile: imageFile // Optional
});
```

**Features**:
- Password validation and hashing
- Image upload to Cloudinary
- Email verification token generation
- Newsletter subscription linking
- Database transaction for data consistency

### 3. `getUserById.ts`
**Purpose**: Fetch single user by ID

**Parameters**:
```typescript
{
  userId: string;
}
```

**Returns**: `Promise<IUserResponse>`

**Usage**:
- Server components: User profile pages
- API routes: Single user endpoints
- Features: User profile display, user management

**Example**:
```typescript
const result = await getUserById('507f1f77bcf86cd799439011');
if (result.success) {
  console.log(result.data); // Serialized user object
}
```

### 4. `updateUserProfile.ts` ⭐ **ENHANCED VERSION**
**Purpose**: Update user profile with comprehensive features

**Parameters**:
```typescript
{
  userId: string;
  profileData: IUpdateProfileData;
  sessionUserId: string;
}
```

**Returns**: `Promise<IApiResponse<ISerializedUser>>`

**Usage**:
- Client components: Profile editing forms
- Server components: Profile management
- Features: Complete profile management

**Example**:
```typescript
const result = await updateUserProfile(
  session.user.id,
  {
    username: 'newusername',
    preferences: {
      language: 'en',
      region: 'US'
    },
    subscriptionPreferences: {
      categories: ['health', 'fitness'],
      subscriptionFrequencies: 'weekly'
    },
    imageFile: newImageFile // Optional
  },
  session.user.id
);
```

**Features**:
- ✅ **Authorization**: User can only update their own profile
- ✅ **Password Change**: Change password with current password verification
- ✅ **Image Management**: Upload new images and delete old ones
- ✅ **Language/Region Sync**: Automatic region mapping when language changes
- ✅ **Subscription Management**: Update newsletter preferences
- ✅ **Partial Updates**: Only update changed fields
- ✅ **Validation**: Comprehensive input validation
- ✅ **Serialization**: Proper MongoDB object serialization
- ✅ **Error Handling**: Structured error responses

### 5. `deleteUser.ts`
**Purpose**: Deactivate user with authorization

**Parameters**:
```typescript
{
  userId: string;
  sessionUserId: string;
}
```

**Returns**: `Promise<IDeleteUserResponse>`

**Usage**:
- Server components: User deactivation
- API routes: User deletion endpoints
- Features: Account deactivation, user management

**Example**:
```typescript
const result = await deleteUser(
  '507f1f77bcf86cd799439011',
  sessionUserId
);
```

**Features**:
- Authorization check (user can only deactivate their own account)
- Soft delete (sets isActive to false)
- ObjectId validation

### 6. `commentReport.ts`
**Purpose**: Send comment report email notification

**Parameters**:
```typescript
{
  email: string;
  username: string;
  commentText: string;
  reason: string;
  articleTitle: string;
  locale: string;
}
```

**Returns**: `Promise<{ success: boolean; data?: any; error?: string }>`

**Usage**:
- Server components: Comment reporting
- API routes: Comment report endpoints
- Features: Content moderation, user notifications

## Profile Management Flow

### Language and Region Synchronization

The profile management system includes sophisticated language and region synchronization:

#### 1. Language Change Handler
```typescript
const handleLanguageChange = (newLanguage: string) => {
  // Map language codes to region codes
  const languageToRegion: Record<string, string> = {
    en: "US", pt: "BR", es: "ES", fr: "FR", de: "DE",
    it: "IT",
  };

  const newRegion = languageToRegion[newLanguage] || "US";
  
  // Update both form fields
  setValue("preferences.language", newLanguage);
  setValue("preferences.region", newRegion);
  
  // Navigate to new language
  router.replace(newPath);
};
```

#### 2. Form Submission
```typescript
const updateData = {
  preferences: {
    language: data.preferences.language, // Form value
    region: data.preferences.region,     // Form value (auto-synced)
  },
  // ... other fields
};
```

#### 3. Change Detection
```typescript
const hasChanges = useMemo(() => {
  const currentValues = {
    preferences: {
      language: watchedValues.preferences?.language || locale,
      region: watchedValues.preferences?.region,
    },
    // ... other fields
  };
  
  return JSON.stringify(currentValues) !== JSON.stringify(originalValues);
}, [watchedValues, originalValues, locale]);
```

## Data Flow Examples

### 1. User Registration Flow
```
User submits registration form with image
↓
Server Component calls createUser()
↓
Password validation + Image upload to Cloudinary
↓
Database transaction (User + Subscription creation)
↓
Email confirmation sent
↓
Success response
```

### 2. User Profile Update Flow
```
User submits profile update form
↓
Client Component calls updateUserProfile()
↓
Authorization check (user can only update own profile)
↓
Language/Region synchronization
↓
Image handling (upload new or delete existing)
↓
Database update with serialization
↓
Client Component receives updated data
↓
UI updates with new data
```

### 3. User Profile Display Flow
```
User visits profile page
↓
Server Component calls getUserById()
↓
MongoDB Query + Serialization
↓
Client Component receives serialized user data
↓
Profile display with language selector
```

### 4. Language Change Flow
```
User selects new language
↓
handleLanguageChange() updates form values
↓
Region automatically mapped to language
↓
Navigation to new language route
↓
Form shows "has changes" state
↓
User saves to update database
```

## Key Features

### 1. Type Safety
- All actions use shared interfaces (`ICreateUserParams`, `ISerializedUser`)
- Consistent return types across server actions and API routes
- TypeScript ensures compile-time safety

### 2. Serialization
- MongoDB objects are serialized to plain objects
- `ObjectId` and `Date` objects converted to strings
- Client components receive serialized data
- Prevents "Only plain objects" errors

### 3. Authorization
- User can only update/deactivate their own account
- Session validation for protected operations
- Role-based access control

### 4. Image Handling
- Cloudinary integration for image uploads
- Automatic image deletion when updating
- Support for optional image uploads
- Image preview functionality

### 5. Data Validation
- Password strength validation
- Email format and uniqueness validation
- ObjectId format validation
- Required field validation
- Form validation with real-time feedback

### 6. Error Handling
- Server actions return structured error responses
- Graceful handling of validation errors
- Database transaction rollback on failures
- User-friendly error messages

### 7. Language/Region Management
- Automatic region mapping for languages
- Form synchronization between language and region
- Change detection for unsaved changes
- Seamless language switching

## Response Types

### IUserResponse
```typescript
interface IUserResponse {
  success: boolean;
  message?: string;
  data?: ISerializedUser | ISerializedUser[];
  error?: string;
}
```

### ICreateUserResponse
```typescript
interface ICreateUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}
```

### IUpdateUserResponse
```typescript
interface IUpdateUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}
```

### IDeleteUserResponse
```typescript
interface IDeleteUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}
```

### ISerializedUser
```typescript
interface ISerializedUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  birthDate: string;
  imageFile?: string;
  imageUrl?: string;
  preferences: IUserPreferences;
  subscriptionPreferences?: ISubscriptionPreferences;
  likedArticles?: string[];
  commentedArticles?: string[];
  subscriptionId?: string | null;
  lastLogin?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### IUpdateProfileData
```typescript
interface IUpdateProfileData {
  username?: string;
  email?: string;
  role?: string;
  birthDate?: string;
  preferences?: {
    language: string;
    region: string;
  };
  subscriptionPreferences?: {
    categories: string[];
    subscriptionFrequencies: string;
  };
  imageFile?: File;
  currentPassword?: string;
  newPassword?: string;
  subscriptionId?: string | null;
}
```

## Performance Considerations

### 1. Database Operations
- Efficient MongoDB queries with proper indexing
- Lean queries for better performance
- Selective field projection (excluding password)
- Direct database access (no HTTP overhead)

### 2. Image Handling
- Cloudinary integration for optimized image delivery
- Automatic image cleanup on updates
- Conditional image processing
- Image preview without server round-trips

### 3. Serialization
- Proper MongoDB object serialization
- Prevents client component errors
- Optimized data transfer
- Type-safe data structures

### 4. Form Management
- Real-time change detection
- Optimized re-renders
- Efficient state management
- Debounced validation

## Security Features

### 1. Authorization
- Built-in authorization checks
- User can only modify their own data
- Session validation
- Role-based access control

### 2. Validation
- Server-side validation
- Password strength requirements
- Input sanitization
- Email uniqueness validation

### 3. Data Integrity
- Database transactions
- ObjectId validation
- Structured error handling
- Rollback on failures

## Testing

### Server Actions
```typescript
// Test getUsers
const result = await getUsers();
console.log(result.success); // Should be true
console.log(result.data?.length); // Should be number of users

// Test createUser
const createResult = await createUser({
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPass123!',
  role: 'user',
  birthDate: '1990-01-01',
  language: 'en',
  region: 'US'
});
console.log(createResult.success); // Should be true

// Test getUserById
const userResult = await getUserById('507f1f77bcf86cd799439011');
console.log(userResult.success); // Should be true if user exists

// Test updateUserProfile
const updateResult = await updateUserProfile(
  '507f1f77bcf86cd799439011',
  {
    username: 'updateduser',
    preferences: {
      language: 'en',
      region: 'US'
    }
  },
  '507f1f77bcf86cd799439011'
);
console.log(updateResult.success); // Should be true

// Test deleteUser
const deleteResult = await deleteUser(
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439011'
);
console.log(deleteResult.success); // Should be true
```

### Profile Management
```typescript
// Test language change
const handleLanguageChange = (newLanguage: string) => {
  // Should update both language and region
  setValue("preferences.language", newLanguage);
  setValue("preferences.region", languageToRegion[newLanguage]);
};

// Test form submission
const onSubmit = async (data: FormData) => {
  const result = await updateUserProfile(
    session.user.id,
    {
      preferences: {
        language: data.preferences.language,
        region: data.preferences.region
      }
    },
    session.user.id
  );
  // Should update both language and region in database
};
```

## Integration with API Routes

The server actions are designed to be used by the existing API routes:

```typescript
// In app/api/v1/users/route.ts
import { getUsers, createUser } from '@/app/actions/user';

export const GET = async () => {
  const result = await getUsers();
  return NextResponse.json(result);
};

export const POST = async (req: Request) => {
  const formData = await req.formData();
  const params = extractCreateUserParams(formData);
  const result = await createUser(params);
  return NextResponse.json(result);
};
```

## Migration from Legacy Systems

### From userService.ts to Server Actions

#### Before (userService.ts)
```typescript
import { userService } from '@/services/userService';

const result = await userService.updateUserProfile(userId, {
  username: 'newusername',
  email: 'newemail@example.com',
  preferences: {
    language: 'en',
    region: 'US'
  },
  imageFile: file
});
```

#### After (Server Actions)
```typescript
import { updateUserProfile } from '@/app/actions/user/updateUserProfile';

const result = await updateUserProfile(
  userId,
  {
    username: 'newusername',
    email: 'newemail@example.com',
    preferences: {
      language: 'en',
      region: 'US'
    },
    imageFile: file
  },
  sessionUserId
);
```

### Benefits of Migration
- ✅ **Better Performance**: Direct database access
- ✅ **Enhanced Security**: Built-in authorization
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Better Error Handling**: Structured responses
- ✅ **Server-Side Rendering**: Full SSR support
- ✅ **Language/Region Sync**: Automatic synchronization

## Troubleshooting

### Common Issues

1. **Serialization Errors**: 
   - Ensure all server actions return serialized data
   - Use `ISerializedUser` interface for client components

2. **Authorization Errors**: 
   - Verify session validation
   - Check user ID matching

3. **Language/Region Sync Issues**: 
   - Ensure form values are updated together
   - Check change detection logic

4. **Image Upload Issues**: 
   - Check Cloudinary configuration
   - Verify file validation

5. **Validation Errors**: 
   - Check input data format
   - Verify required fields

### Debug Tips

1. Check server action return values
2. Verify authorization logic
3. Test with different user roles
4. Check image upload configuration
5. Verify database transaction handling
6. Test language/region synchronization

## Future Enhancements

1. **Bulk Operations**: Add bulk user operations
2. **Advanced Filtering**: Add filtering and sorting options
3. **User Analytics**: Track user activity and engagement
4. **Role Management**: Enhanced role-based permissions
5. **User Search**: Search users by various criteria
6. **Export/Import**: User data export and import functionality
7. **Audit Logging**: Track user changes and actions
8. **Real-time Updates**: WebSocket integration for real-time updates
9. **Advanced Image Processing**: Image optimization and resizing
10. **Multi-language Support**: Enhanced internationalization

## Conclusion

The user management system provides a robust, scalable, and maintainable solution for handling user operations across both server-side rendering and API access. With comprehensive features including authorization, validation, image handling, and language/region synchronization, the system is ready for production use and future enhancements.

### Key Achievements
- ✅ **Complete CRUD Operations**: All user management features
- ✅ **Enhanced Security**: Authorization and validation
- ✅ **Better Performance**: Direct database access
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Language Management**: Sophisticated language/region sync
- ✅ **Error Handling**: Comprehensive error management
- ✅ **API Compatibility**: Third-party access support
- ✅ **Server-Side Rendering**: Full SSR support

The system is production-ready and provides a solid foundation for future user management features.
