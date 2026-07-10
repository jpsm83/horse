# Social Media Video Metadata Documentation

This document outlines the **simplified and effective** metadata implementation for video content sharing across all major social media platforms, following ChatGPT's proven approach.

## Supported Platforms

✅ **Twitter** - Player Card with video  
✅ **Instagram** - Open Graph video support  
✅ **Pinterest** - Rich Pin video support  
✅ **Facebook** - Open Graph video support  
✅ **LinkedIn** - Professional video sharing  
✅ **WhatsApp** - Video link previews  
✅ **Discord** - Video embed support  
✅ **Threads** - Meta's Twitter competitor  

## Simple & Effective Approach

### Key Principle: Include BOTH Video AND Image
- **Video metadata comes first** (Next.js handles this automatically)
- **Image serves as fallback** for platforms that don't support video
- **Pinterest prioritizes video** when video metadata comes before image metadata

## Metadata Structure

### Open Graph (Primary - Used by Facebook, Instagram, Threads, WhatsApp, Discord)

```html
<meta property="og:type" content="video.other" />
<meta property="og:title" content="Your Article Title" />
<meta property="og:description" content="Your article description" />
<meta property="og:url" content="https://yoursite.com/article" />
<meta property="og:site_name" content="Women's Spot" />
<meta property="og:locale" content="en-US" />
<meta property="og:video" content="https://example.com/video.mp4" />
<meta property="og:video:type" content="video/mp4" />
<meta property="og:video:width" content="1080" />
<meta property="og:video:height" content="1920" />
<meta property="og:video:secure_url" content="https://example.com/video.mp4" />
<meta property="og:image" content="https://example.com/thumbnail.jpg" />
```

### Twitter Cards

```html
<meta name="twitter:card" content="player" />
<meta name="twitter:title" content="Your Article Title" />
<meta name="twitter:description" content="Your article description" />
<meta name="twitter:player" content="https://example.com/video.mp4" />
<meta name="twitter:player:width" content="1080" />
<meta name="twitter:player:height" content="1920" />
<meta name="twitter:image" content="https://example.com/thumbnail.jpg" />
<meta name="twitter:creator" content="Author Name" />
<meta name="twitter:site" content="@womensspot" />
```

## Key Features

### 1. Video Prioritization (ChatGPT's Method)
- **Include BOTH video and image** in metadata
- **Video metadata comes first** in the HTML head
- **Pinterest prioritizes video** when video tags come before image tags
- Uses `og:type="video.other"` for better platform recognition

### 2. Twitter Player Cards
- Uses `twitter:card="player"` for video content
- Forces Twitter to display video instead of static image
- Includes both player and image for maximum compatibility

### 3. Simple & Clean
- **No platform-specific metadata** - unnecessary complexity
- **Standard Open Graph** handles most platforms
- **Twitter Cards** handle Twitter specifically
- **Minimal additional metadata** for essential platforms only

## Why This Approach Works

1. **Pinterest**: Video metadata comes first, so Pinterest selects video over image
2. **Twitter**: Player Card forces video display
3. **Facebook/Instagram**: Open Graph video is prioritized
4. **Other platforms**: Standard Open Graph video support
5. **Fallback**: Image is always available for platforms that don't support video

## Testing Your Metadata

Use these tools to validate your metadata:

- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
- **Pinterest Rich Pins Validator**: https://developers.pinterest.com/tools/url-debugger/

## Result

With this **simplified implementation**, when you share your article URLs on any platform, they will:

✅ **Display video content instead of images**  
✅ **Show proper video thumbnails and play buttons**  
✅ **Maintain consistent branding across platforms**  
✅ **Provide optimal viewing experience on each platform**  
✅ **Work reliably without overcomplication**  

This **simple and effective** approach ensures maximum engagement and proper video content display across all major social media platforms.
