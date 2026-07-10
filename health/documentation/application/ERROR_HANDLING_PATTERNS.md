# Error Handling Patterns

This document describes the error handling patterns used across services, actions, and routes.

## Service Layer

**Pattern**: All services throw `Error` with descriptive messages

**Examples**:
```typescript
// lib/services/articles.ts
if (!article) {
  throw new Error("Article not found");
}

// lib/services/users.ts
if (duplicateUser) {
  throw new Error("User with email already exists!");
}

// lib/services/comments.ts
if (!commentId) {
  throw new Error("Comment ID is required");
}
```

**Rationale**:
- Consistent error model across all services
- Services are pure functions - they throw, don't return error objects
- Descriptive messages help with debugging
- Routes/actions can catch and format as needed

## API Routes

**Pattern**: Catch service errors and wrap with `handleApiError`

**Examples**:
```typescript
// app/api/v1/articles/route.ts
export const GET = async (req: Request) => {
  try {
    const result = await getArticlesService(params);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError("Get all articles failed!", error as string);
  }
};
```

**Rationale**:
- Routes handle HTTP concerns (status codes, response format)
- `handleApiError` provides consistent error response format
- Catches service errors and converts to HTTP responses

## Server Actions

**Pattern**: Two approaches - throw errors OR return error objects

### Pattern A: Throw Errors (Simple Operations)

**Examples**:
```typescript
// app/actions/article/getArticles.ts
export async function getArticles(params) {
  try {
    return await getArticlesService(params);
  } catch (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }
}
```

**Use When**:
- Simple read operations
- Component can handle errors directly
- Error should bubble up to Next.js error boundary

### Pattern B: Return Error Objects (Complex Operations)

**Examples**:
```typescript
// app/actions/user/getUserById.ts
export async function getUserById(userId: string): Promise<IUserResponse> {
  try {
    const user = await getUserByIdService(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Get user by userId failed!",
    };
  }
}
```

**Use When**:
- Operations that need structured responses
- Client components need to handle errors gracefully
- Need to return success/error state explicitly

## Error Response Formats

### API Routes
```typescript
// Via handleApiError
{
  message: "Get all articles failed!",
  error: "Article not found"
}
```

### Server Actions (Pattern B)
```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  message?: string,
  error?: string
}
```

## Summary

| Layer | Error Handling | Pattern |
|-------|---------------|---------|
| **Services** | Throw `Error` | Always throw, never return error objects |
| **API Routes** | Catch & wrap | Use `handleApiError` for consistent format |
| **Server Actions** | Throw OR return | Pattern A: Throw (simple), Pattern B: Return object (complex) |

## Best Practices

1. **Services**: Always throw errors, never return error objects
2. **Routes**: Always catch and wrap with `handleApiError`
3. **Actions**: Choose pattern based on use case:
   - Simple operations → Throw errors
   - Complex operations → Return error objects
4. **Error Messages**: Be descriptive and actionable
5. **Consistency**: Use same pattern within each domain

## Notes

- Current mix of patterns in actions is acceptable
- Standardization can be done incrementally if needed
- Pattern choice depends on how errors are consumed by components
- Services remain consistent (always throw)

