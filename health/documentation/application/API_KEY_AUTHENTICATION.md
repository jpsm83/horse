# API Key Authentication for n8n Integration

This document explains how to use API key authentication to create articles from n8n without going through the login flow.

## Overview

The following API endpoints now support two authentication methods:
1. **Session Authentication** (existing) - For web application users
2. **API Key Authentication** (new) - For n8n and other external integrations

### Supported Endpoints

| Method | Endpoint | Description | Recommended for n8n |
|--------|----------|-------------|-------------------|
| `POST` | `/api/v1/articles` | Create article with images | ✅ **Recommended** |
| `PUT` | `/api/v1/articles/by-id/{articleId}` | Update article with images | ✅ **Recommended** |
| `DELETE` | `/api/v1/articles/by-id/{articleId}` | Delete article | ✅ **Recommended** |
| `POST` | `/api/v1/upload/image` | Upload single image to existing article | ⚠️ **Legacy** |

**Note**: For n8n integration, we recommend using the article endpoints (`POST`/`PUT`) as they provide comprehensive functionality and better error handling. The standalone upload endpoint is maintained for backward compatibility.

## Image Upload Approaches

### 1. **Recommended: Article Endpoints** ✅
Use `POST /api/v1/articles` or `PUT /api/v1/articles/by-id/{articleId}` for image uploads:

**Advantages:**
- Handles multiple images in one request
- Comprehensive validation and error handling
- Supports both session and API key authentication
- Better integration with article workflow
- Atomic operations (article + images in one transaction)

**Use Case:** Creating or updating articles with images

### 2. **Legacy: Standalone Upload** ⚠️
Use `POST /api/v1/upload/image` for single image uploads:

**Advantages:**
- Simple single image upload
- Can add images to existing articles

**Disadvantages:**
- Only handles one image at a time
- Requires separate requests for multiple images
- Less comprehensive error handling
- More complex workflow for n8n

**Use Case:** Adding single images to existing articles (legacy support)

## Custom Article ID Feature

The article creation endpoint now supports an optional `id` parameter that allows you to specify a custom MongoDB ObjectId for the article:

### **When to Use Custom ID:**
- **n8n Integration**: When you need predictable article IDs for referencing
- **Data Migration**: When importing articles with existing IDs
- **External System Integration**: When you need to maintain ID consistency across systems

### **How It Works:**
1. **With Custom ID**: `POST /api/v1/articles` with `id` parameter → Uses your specified ID
2. **Without Custom ID**: `POST /api/v1/articles` without `id` parameter → Generates new ObjectId automatically

### **Validation:**
- Custom ID must be a valid MongoDB ObjectId format
- Custom ID must not already exist in the database
- Returns 409 Conflict if ID already exists
- Returns 400 Bad Request if ID format is invalid

### **Example Usage:**
```bash
# Create article with custom ID
curl -X POST http://localhost:3000/api/v1/articles \
  -H "Authorization: Bearer your-api-key" \
  -F "id=507f1f77bcf86cd799439011" \
  -F "category=health" \
  # ... other parameters

# Create article with auto-generated ID (default behavior)
curl -X POST http://localhost:3000/api/v1/articles \
  -H "Authorization: Bearer your-api-key" \
  -F "category=health" \
  # ... other parameters
```

## Setup

### 1. Environment Variable

Add the following environment variable to your `.env.local` file:

```env
API_KEY=your-secure-api-key-here
```

**Important**: Choose a strong, random API key. You can generate one using:
```bash
# Generate a secure random API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Admin User Requirement

The API key authentication requires at least one admin user in your database. When using API key authentication, articles will be created with the first admin user as the creator.

## Usage

### HTTP Request Format

#### Create Article
```http
POST /api/v1/articles
Authorization: Bearer your-api-key-here
Content-Type: multipart/form-data
```

#### Update Article
```http
PUT /api/v1/articles/by-id/{articleId}
Authorization: Bearer your-api-key-here
Content-Type: multipart/form-data
```

#### Delete Article
```http
DELETE /api/v1/articles/by-id/{articleId}
Authorization: Bearer your-api-key-here
```

### Examples with cURL

#### Create Article
```bash
curl -X POST http://localhost:3000/api/v1/articles \
  -H "Authorization: Bearer your-api-key-here" \
  -F "category=health" \
  -F "languages=[{\"hreflang\":\"en\",\"mediaContext\":{\"paragraphOne\":\"Test paragraph 1\",\"paragraphTwo\":\"Test paragraph 2\",\"paragraphThree\":\"Test paragraph 3\"},\"seo\":{\"metaTitle\":\"Test Article\",\"metaDescription\":\"Test description\",\"keywords\":\"test,health\",\"slug\":\"test-article\",\"hreflang\":\"en\",\"canonicalUrl\":\"https://example.com/articles/test-article\"},\"content\":{\"articleContents\":[{\"subTitle\":\"Test Subtitle\",\"articleParagraphs\":[\"Test paragraph content\"]}]}}]" \
  -F "imagesContext={\"imageOne\":\"test1.jpg\",\"imageTwo\":\"test2.jpg\",\"imageThree\":\"test3.jpg\",\"imageFour\":\"test4.jpg\"}" \
  -F "articleImages=@image1.jpg" \
  -F "articleImages=@image2.jpg"
```

#### Create Article with Custom ID
```bash
curl -X POST http://localhost:3000/api/v1/articles \
  -H "Authorization: Bearer your-api-key-here" \
  -F "id=507f1f77bcf86cd799439011" \
  -F "category=health" \
  -F "languages=[{\"hreflang\":\"en\",\"mediaContext\":{\"paragraphOne\":\"Test paragraph 1\",\"paragraphTwo\":\"Test paragraph 2\",\"paragraphThree\":\"Test paragraph 3\"},\"seo\":{\"metaTitle\":\"Test Article\",\"metaDescription\":\"Test description\",\"keywords\":\"test,health\",\"slug\":\"test-article\",\"hreflang\":\"en\",\"canonicalUrl\":\"https://example.com/articles/test-article\"},\"content\":{\"articleContents\":[{\"subTitle\":\"Test Subtitle\",\"articleParagraphs\":[\"Test paragraph content\"]}]}}]" \
  -F "imagesContext={\"imageOne\":\"test1.jpg\",\"imageTwo\":\"test2.jpg\",\"imageThree\":\"test3.jpg\",\"imageFour\":\"test4.jpg\"}" \
  -F "articleImages=@image1.jpg" \
  -F "articleImages=@image2.jpg"
```

#### Update Article
```bash
curl -X PUT http://localhost:3000/api/v1/articles/by-id/ARTICLE_ID_HERE \
  -H "Authorization: Bearer your-api-key-here" \
  -F "category=fitness" \
  -F "languages=[{\"hreflang\":\"en\",\"canvas\":{\"paragraphOne\":\"Updated paragraph 1\",\"paragraphTwo\":\"Updated paragraph 2\",\"paragraphThree\":\"Updated paragraph 3\"},\"seo\":{\"metaTitle\":\"Updated Article\",\"metaDescription\":\"Updated description\",\"keywords\":\"updated,fitness\",\"slug\":\"updated-article\",\"hreflang\":\"en\",\"canonicalUrl\":\"https://example.com/articles/updated-article\"},\"content\":{\"articleContents\":[{\"subTitle\":\"Updated Subtitle\",\"articleParagraphs\":[\"Updated paragraph content\"]}]}}]" \
  -F "imagesContext={\"imageOne\":\"updated1.jpg\",\"imageTwo\":\"updated2.jpg\",\"imageThree\":\"updated3.jpg\",\"imageFour\":\"updated4.jpg\"}" \
  -F "articleImages=@new-image1.jpg"
```

#### Delete Article
```bash
curl -X DELETE http://localhost:3000/api/v1/articles/by-id/ARTICLE_ID_HERE \
  -H "Authorization: Bearer your-api-key-here"
```

#### Upload Single Image (Legacy)
```bash
curl -X POST http://localhost:3000/api/v1/upload/image \
  -H "Authorization: Bearer your-api-key-here" \
  -F "image=@single-image.jpg" \
  -F "folderId=ARTICLE_ID_HERE"
```

### n8n Configuration

#### Create Article
Configure your HTTP Request node with:

1. **Method**: POST
2. **URL**: `https://your-domain.com/api/v1/articles`
3. **Headers**:
   - `Authorization`: `Bearer your-api-key-here`
4. **Body Type**: Form-Data
5. **Body Parameters**:
   - `id`: String (optional) - Custom MongoDB ObjectId for the article
   - `category`: String (e.g., "health", "fitness", "nutrition")
   - `languages`: JSON string (array of language objects)
   - `imagesContext`: JSON string (object with imageOne, imageTwo, etc.)
   - `articleImages`: File uploads

#### Update Article
Configure your HTTP Request node with:

1. **Method**: PUT
2. **URL**: `https://your-domain.com/api/v1/articles/by-id/{articleId}`
3. **Headers**:
   - `Authorization`: `Bearer your-api-key-here`
4. **Body Type**: Form-Data
5. **Body Parameters** (all optional):
   - `category`: String (e.g., "health", "fitness", "nutrition")
   - `languages`: JSON string (array of language objects)
   - `imagesContext`: JSON string (object with imageOne, imageTwo, etc.)
   - `articleImages`: File uploads (will be added to existing images)

#### Delete Article
Configure your HTTP Request node with:

1. **Method**: DELETE
2. **URL**: `https://your-domain.com/api/v1/articles/by-id/{articleId}`
3. **Headers**:
   - `Authorization`: `Bearer your-api-key-here`

## Authentication Flow

```
n8n Request
    ↓
API Key Validation
    ↓
Find Admin User
    ↓
Create Article (with admin as creator)
    ↓
Return Success Response
```

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Invalid or missing API key. Please provide a valid API key in the Authorization header.",
  "error": "UNAUTHORIZED"
}
```

### 500 Internal Server Error
```json
{
  "message": "No admin user found for API key authentication"
}
```

## Security Considerations

1. **Keep your API key secure** - Don't commit it to version control
2. **Use HTTPS in production** - API keys should only be sent over encrypted connections
3. **Rotate keys regularly** - Consider changing your API key periodically
4. **Monitor usage** - Keep track of API key usage for security purposes

## Testing

You can test the API key authentication using the provided test script:

```bash
# Update the API_KEY in test-api-key.js with your actual key
node test-api-key.js
```

## Migration from Session Authentication

If you're currently using session authentication in n8n, you can now switch to API key authentication by:

1. Adding the `Authorization: Bearer your-api-key` header
2. Removing any CSRF token handling
3. Removing login flow steps

This will significantly simplify your n8n workflow and make it more reliable.
