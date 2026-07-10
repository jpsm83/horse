# Social Media Metadata Implementation

## Overview

This implementation provides comprehensive metadata generation for all 6 major social media platforms, with platform-specific image optimization for each platform's requirements.

## Supported Platforms

- **Facebook** - 1200x630px recommended
- **Instagram** - 1080x1080px recommended  
- **X (Twitter)** - 1200x675px recommended
- **Pinterest** - 1000x1500px recommended
- **TikTok** - 1080x1920px recommended
- **Threads** - 1080x1080px recommended

## Key Features

### 1. Unified Image Selection
All social media platforms now use the same `postImage` from the article's language-specific data, ensuring consistent display across all platforms.

### 2. Fallback Strategy
- Primary: `postImage` from language-specific data
- Secondary: General `articleImages` array
- Tertiary: Default Women's Spot logo

### 3. Video Prioritization
When videos are present, they take priority over images for platforms that support video content (Pinterest, Twitter).

## Usage Examples

### For Article Pages

```typescript
import { generateArticleMetadata } from '@/lib/utils/articleMetadata';

// Basic usage - automatically extracts social media images
const metadata = await generateArticleMetadata(articleData);

// The function will automatically:
// 1. Extract postImage from the language-specific data
// 2. Use the same image for all social media platforms
```

### For Generic Pages

```typescript
import { 
  generatePublicMetadataWithSocialMedia,
  generatePrivateMetadataWithSocialMedia 
} from '@/lib/utils/genericMetadata';

// With postImage
const metadata = await generatePublicMetadataWithSocialMedia(
  'en',
  '/articles',
  'metadata.articles.title',
  'https://example.com/social-image.jpg'
);

// Without postImage (uses default images)
const metadata = await generatePublicMetadataWithSocialMedia(
  'en',
  '/articles',
  'metadata.articles.title'
);
```

### Manual Image Specification

```typescript
import { generatePublicMetadata } from '@/lib/utils/genericMetadata';

const metadata = await generatePublicMetadata(
  'en',
  '/articles',
  'metadata.articles.title',
  'https://example.com/social-image.jpg'
);
```

## Data Structure

### Article Schema (MongoDB)
```typescript
{
  languages: [{
    postImage: "https://example.com/social-media-image.jpg", // Single image for all platforms
    socialMedia: {
      facebook: {
        // ... facebook fields (no postImage)
      },
      instagram: {
        // ... instagram fields (no postImage)
      },
      xTwitter: {
        // ... twitter fields (no postImage)
      },
      pinterest: {
        // ... pinterest fields (no postImage)
      },
      tiktok: {
        // ... tiktok fields (no postImage)
      },
      threads: {
        // ... threads fields (no postImage)
      }
    }
  }]
}
```

## Metadata Output

### Open Graph (Facebook, LinkedIn, WhatsApp)
```html
<meta property="og:image" content="https://example.com/social-media-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
```

### Twitter Cards
```html
<meta name="twitter:image" content="https://example.com/social-media-image.jpg" />
<meta name="twitter:image:width" content="1200" />
<meta name="twitter:image:height" content="675" />
```

### Pinterest Rich Pins
```html
<meta property="pinterest:image" content="https://example.com/social-media-image.jpg" />
<meta property="pinterest:image:width" content="1000" />
<meta property="pinterest:image:height" content="1500" />
```

### Platform-Specific Metadata
```html
<!-- TikTok -->
<meta property="tiktok:image" content="https://example.com/social-media-image.jpg" />
<meta property="tiktok:image:width" content="1080" />
<meta property="tiktok:image:height" content="1920" />

<!-- Threads -->
<meta property="threads:image" content="https://example.com/social-media-image.jpg" />
<meta property="threads:image:width" content="1080" />
<meta property="threads:image:height" content="1080" />
```

## Helper Functions

### extractSocialMediaImages()
```typescript
import { extractSocialMediaImages } from '@/lib/utils/articleMetadata';

const socialMediaImages = extractSocialMediaImages(article.postImage);
// Returns: { facebook?: string, instagram?: string, ... }
```

## Best Practices

1. **Image Dimensions**: Always provide images in the recommended dimensions for each platform
2. **Format**: Use PNG or JPG formats for better compatibility
3. **HTTPS**: Ensure all image URLs use HTTPS for security
4. **Alt Text**: The system automatically generates appropriate alt text from the article title
5. **Fallbacks**: The system gracefully falls back to general images or default logo if platform-specific images are missing

## Migration Notes

- The `IMetaDataArticle` interface now includes optional `postImage` field
- The `ILanguageSpecific` interface now includes required `postImage` field
- Individual social media interfaces no longer have `postImage` fields
- All social media platforms now use the same image from the language-specific level
- Existing code will continue to work as the postImage field is optional in metadata
- All existing metadata generation functions maintain backward compatibility
