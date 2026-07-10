# How Google AdSense Auto Ads Work

## Overview

Google AdSense Auto Ads is an automated advertising system that uses machine learning to automatically place ads on your website in optimal locations. This document explains the technical flow of how Auto Ads work, from script loading to ad rendering.

## Table of Contents

1. [Script Loading](#script-loading)
2. [Initial Page Scan](#initial-page-scan)
3. [Ad Placement Process](#ad-placement-process)
4. [Client-Side Navigation Challenges](#client-side-navigation-challenges)
5. [Manual Re-scanning with push()](#manual-re-scanning-with-push)
6. [Specific Ad Units (AdBanner Component)](#specific-ad-units-adbanner-component)
7. [Best Practices](#best-practices)

---

## Script Loading

### Step 1: Script Tag in HTML Head

**For Traditional HTML/Static Sites:**
```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
  crossOrigin="anonymous"
/>
```

**For Next.js 15 (SSR Framework) - Recommended Approach:**
```tsx
import Script from "next/script";

// In your root layout.tsx <body> section:
<Script
  async
  id="adsbygoogle-init"
  strategy="afterInteractive"
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4895395148287261"
  crossOrigin="anonymous"
/>
```

**Note:** While Google recommends placing the script in `<head>`, Next.js `Script` component with `strategy="afterInteractive"` will inject it into `<head>` automatically, even if the component is placed in `<body>`. This is the current implementation approach.

**Key Points:**
- Script must be in `<head>` section (Google's official requirement)
- `async` attribute (or `afterInteractive` strategy) allows non-blocking loading
- `?client=ca-pub-XXXXXXXXXX` parameter enables Auto Ads mode
- Script loads asynchronously, doesn't block page rendering
- **Next.js 15**: Use `Script` component with `strategy="afterInteractive"` for better optimization
- **Next.js 15**: Script persists across client-side navigations (root layout doesn't re-render)
- **Next.js 15**: `window.adsbygoogle` stays in memory, allowing `push({})` to work on navigation

### Step 2: Script Execution

When the script loads:
1. Creates `window.adsbygoogle = []` array (if it doesn't exist)
2. This array acts as a **queue** for ad initialization commands
3. Script analyzes the page structure and content
4. Determines if Auto Ads are enabled for this domain

**Important:** The script only **auto-scans** on **initial page load**. It does NOT automatically re-scan on client-side navigation.

**✅ Solution: Manual Re-scanning on Every Page Render**

For Next.js apps (or any SPA) where each page has different content, you **CAN and SHOULD** trigger a re-scan on every page render. This is achieved by calling `window.adsbygoogle.push({})` after each route change.

**How it works:**
- Script loads once and stays in memory
- `window.adsbygoogle` array persists across navigations
- On each route change, call `push({})` to trigger a fresh scan
- AdSense will analyze the new page content and place ads accordingly
- This gives you the same behavior as full page reloads, but optimized for SPAs

**Your Current Implementation:**
Your `AdSenseRouter` component already implements this! It:
- Detects route changes via `usePathname()`
- Waits for content to render (using `requestAnimationFrame` + delay)
- Calls `window.adsbygoogle.push({})` to trigger re-scan
- Works on every page navigation

**Result:** Each page gets scanned and ads are placed based on its unique content, just like a full page reload would do. This is the **standard and recommended approach** for Next.js apps with dynamic content per page.

---

## Initial Page Scan

### Automatic Behavior

On the **first page load only**, the AdSense script automatically performs a scan. For subsequent page navigations in Next.js/SPA apps, you need to manually trigger re-scanning (see [Manual Re-scanning with push()](#manual-re-scanning-with-push) section).

The automatic scan on initial load:

1. **Waits for DOM to be ready**
   - Script waits for `document.readyState === 'complete'`
   - Ensures all HTML is parsed and rendered

2. **Analyzes page content**
   - Scans the entire DOM structure
   - Identifies content areas, text blocks, images
   - Detects page layout and structure
   - Measures viewport size and device type

3. **Applies machine learning algorithms**
   - Determines optimal ad placements
   - Considers user experience guidelines
   - Respects `data-no-ad` attributes (excludes those areas)
   - Calculates ad density and placement

4. **Injects ad containers**
   - Dynamically creates `<ins>` elements with `class="adsbygoogle"`
   - Places them in optimal locations
   - Sets appropriate ad formats (display, in-article, anchor, etc.)

5. **Fetches and renders ads**
   - Makes requests to AdSense servers
   - Receives ad content
   - Renders ads in the placed containers

### Timeline

```
Page Load → Script Loads → DOM Ready → Auto Scan → Ad Placement → Ad Rendering
  0ms         100-500ms      500ms        600ms        700ms         1000-2000ms
```

---

## Ad Placement Process

### Prerequisite: Page Must Be Fully Rendered (Next.js 15 SSR Flow)

**Critical Understanding:** AdSense can only analyze and place ads after the **complete, final DOM** is ready. For Next.js 15 SSR apps, this means waiting for the entire rendering pipeline to complete.

**Next.js 15 SSR Rendering Pipeline:**

1. **Server-Side Rendering (SSR)**
   - Server executes React components
   - Fetches data from databases/APIs
   - Renders HTML with content
   - Server completes its entire task

2. **HTML Transmission**
   - Server sends complete HTML to client
   - Initial HTML includes server-rendered content
   - Scripts and stylesheets are referenced

3. **Client Hydration**
   - Browser receives HTML and starts parsing
   - React hydrates the server-rendered HTML
   - React attaches event listeners and state management
   - Client-side JavaScript takes over

4. **React Rendering**
   - React renders all components on client
   - Client components execute their logic
   - Layouts and nested components render
   - Component state initializes

5. **Suspense Boundaries Resolution**
   - Suspense boundaries wait for async data
   - Streaming content loads progressively
   - Fallbacks are replaced with actual content
   - All Suspense boundaries must resolve

6. **Async Data Loading**
   - Client-side data fetching completes
   - API calls finish
   - Images and media load
   - All dynamic content is ready

7. **Final DOM State**
   - All content is rendered in the DOM
   - Layout is stable (no more shifts)
   - Viewport dimensions are final
   - Document ready state is "complete"

**Only After All Steps Complete:**
- ✅ AdSense can analyze the complete DOM structure
- ✅ AdSense can identify content areas accurately
- ✅ AdSense can measure layout and spacing correctly
- ✅ AdSense can place ads in optimal locations

**Why This Matters:**
- If AdSense scans too early, it sees incomplete content
- Missing content = incorrect ad placement decisions
- Suspense boundaries may still be loading = wrong layout measurements
- Async data not loaded = content structure is incomplete
- Result: Poor ad placements or no ads at all

**This is why `AdSenseRouter` waits:**
- Double `requestAnimationFrame` ensures React has painted and layout is stable
- Third RAF cycle (optional) may help catch late layout shifts from Suspense boundaries, but the 500ms delay is the primary mechanism for handling Suspense resolution
- `document.readyState === "complete"` check ensures page is fully loaded
- 500ms delay ensures Suspense boundaries and async content have fully resolved
- Polling mechanism handles slow-loading content
- Script tag verification prevents race conditions where `push({})` is called before script is ready

### How AdSense Decides Where to Place Ads

Once the final DOM is ready, AdSense performs its analysis:

1. **Content Analysis**
   - Identifies main content areas
   - Finds natural breaks in content
   - Detects article structure

2. **Layout Detection**
   - Determines if page is article, blog, homepage, etc.
   - Identifies sidebar, header, footer areas
   - Measures content width and spacing

3. **User Experience Optimization**
   - Avoids placing ads too close together
   - Respects minimum spacing requirements
   - Ensures ads don't interfere with navigation
   - Honors `data-no-ad` attributes

4. **Ad Format Selection**
   - **Display ads**: In-content, sidebar placements
   - **In-article ads**: Between paragraphs
   - **Anchor ads**: Sticky bottom/top ads
   - **Vignette ads**: Full-screen interstitials (mobile)

5. **Device-Specific Optimization**
   - Different placements for mobile vs desktop
   - Responsive ad sizes
   - Touch-friendly placements on mobile

---

## Client-Side Navigation Challenges

### The Problem

**Traditional Websites (Full Page Reloads):**
```
User clicks link → Full page reload → Script loads → Auto scan → Ads appear
```

**Next.js/SPA (Client-Side Navigation):**
```
User clicks link → Route changes → Content updates → Script already loaded → NO auto scan → No ads
```

**Next.js 15 Specific Behavior:**
- Root `layout.tsx` doesn't re-render on client-side navigation
- Script loaded via `Script` component persists in memory
- `window.adsbygoogle` array stays available across navigations
- This is actually **beneficial** - script doesn't need to reload, just needs to re-scan

### Why Ads Disappear

1. **Script doesn't re-execute**
   - Script is already in memory (this is good - no reload needed)
   - No new page load event
   - AdSense doesn't know content changed
   - **Next.js 15**: Script persists, but needs manual trigger to re-scan

2. **No automatic re-scan**
   - Auto scan only happens on initial load
   - Client-side navigation doesn't trigger it
   - Old ad containers remain but content is new
   - **Solution**: Use `AdSenseRouter` component to call `push({})` on route changes

3. **Timing issues**
   - If we call `push({})` too early, content isn't rendered yet
   - AdSense scans incomplete page
   - No suitable ad placements found
   - **Solution**: Wait for React rendering + Suspense boundaries to resolve

---

## Manual Re-scanning with push()

### What `push({})` Does

```javascript
window.adsbygoogle.push({});
```

**Function:**
- Tells AdSense: "Scan the page NOW and place ads"
- Triggers the same scanning process as initial load
- Re-analyzes current DOM state
- Places new ads or updates existing ones

### When to Call `push({})`

**Correct Timing:**
1. ✅ After route change completes
2. ✅ After React finishes rendering new content
3. ✅ After Suspense boundaries resolve
4. ✅ After async content loads
5. ✅ When DOM is stable and complete

**Incorrect Timing:**
1. ❌ Immediately on route change (content not rendered)
2. ❌ Before React hydration completes
3. ❌ While Suspense boundaries are loading
4. ❌ Before async data fetches complete

### Implementation Pattern

**Basic Pattern (Simple but less robust):**
- Use `useEffect` with `usePathname()` as dependency to detect route changes
- Set a timeout to wait for content to render
- Call `window.adsbygoogle.push({})` when ready
- Clean up timeout on unmount or route change

**Limitations:**
- Hardcoded delay may be too short or too long
- No check for document ready state
- No handling of slow script loading
- May not work reliably with Suspense boundaries

**Recommended Pattern (Next.js 15 Best Practices):**

**Component Structure:**
- Mark component with `"use client"` directive (SSR safety)
- Use `usePathname()` hook to detect route changes
- Use `useRef` to track initial mount and cleanup IDs
- Use `useEffect` with pathname dependency

**Initial Mount Flow (SSR → Client Hydration):**
1. Component mounts after client hydration
2. Detect initial mount using `useRef` flag
3. Start checking at 200ms with adaptive retry mechanism (up to 20 retries at 200ms intervals)
4. This catches fast script loads early while still handling slow networks
5. If script is ready, trigger manual scan as fallback (ensures ads load even if auto-scan doesn't trigger)

**Subsequent Navigation Flow:**
1. Route change detected via `usePathname()` dependency
2. Use double `requestAnimationFrame` to wait for React paint cycles and layout stability
3. Optional third RAF cycle may help catch late layout shifts, but 500ms delay is primary mechanism
4. Check `document.readyState === "complete"` before proceeding
5. If document not ready, poll every 50ms until ready
6. Verify script tag exists in DOM (prevents race condition)
7. Add delay (500ms) to ensure Suspense boundaries and async content fully resolve
8. Call `window.adsbygoogle.push({})` when everything is ready

**Cleanup Pattern:**
- Store all timer/animation frame IDs in refs
- Cancel all pending operations in cleanup function
- Prevents memory leaks and race conditions
- Ensures no operations run after component unmounts

**Key Improvements:**
1. ✅ Uses `useRef` for cleanup tracking (React best practice)
2. ✅ Checks `document.readyState` before proceeding (more reliable)
3. ✅ **SSR-Safe**: Handles initial mount with fallback (ensures ads load even if auto-scan doesn't run)
4. ✅ Polls for ready state if not immediately ready (handles edge cases)
5. ✅ Proper cleanup of all timers and animation frames
6. ✅ Optimized delay (500ms) for better Suspense boundary and async content handling
7. ✅ Double `requestAnimationFrame` ensures React has painted and layout is stable
8. ✅ **Race Condition Prevention**: Verifies script tag exists in DOM before calling `push({})` to prevent calling AdSense API before script is ready
9. ✅ **Next.js 15 SSR Compatible**: Works correctly with server-side rendering and client hydration

---

## Specific Ad Units (AdBanner Component)

### Overview

While Auto Ads automatically place ads throughout your site, you can also use **specific ad units** (AdBanner component) to place ads in exact locations you control. This is useful when you want ads in specific positions like between article sections or above/below images.

### Implementation

**AdBanner Component:**
```tsx
"use client";

import React, { useEffect, useRef, useMemo } from "react";

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
  uniqueId?: string;
}

const AdBanner = ({
  dataAdSlot,
  dataAdFormat = "auto",
  dataFullWidthResponsive = true,
  uniqueId,
}: AdBannerProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const elementId = useMemo(
    () => uniqueId || `adbanner-${Math.random().toString(36).substr(2, 9)}`,
    [uniqueId]
  );

  useEffect(() => {
    const getAdElement = () => {
      return document.getElementById(elementId) as HTMLElement | null;
    };

    const hasAdsInitialized = () => {
      const element = getAdElement();
      return element?.getAttribute("data-adsbygoogle-status") !== null;
    };

    const initializeAd = () => {
      if (hasAdsInitialized()) return;

      const element = getAdElement();
      if (!element) return;

      if (window.adsbygoogle && document.readyState === "complete") {
        try {
          window.adsbygoogle.push({});
        } catch {
          // AdSense handles errors
        }
      }
    };

    const tryInitialize = () => {
      if (document.readyState === "complete") {
        timeoutRef.current = setTimeout(initializeAd, 300);
      } else {
        timeoutRef.current = setTimeout(tryInitialize, 100);
      }
    };

    timeoutRef.current = setTimeout(tryInitialize, 200);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dataAdSlot, elementId]);

  return (
    <div className="flex justify-center">
      <ins
        id={elementId}
        className="adsbygoogle"
        style={{ display: "block", minWidth: "320px", minHeight: "100px" }}
        data-ad-client="ca-pub-4895395148287261"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive}
        suppressHydrationWarning
      />
    </div>
  );
};

export default AdBanner;
```

### Key Features

1. **Unique ID Requirement**
   - Each AdBanner instance **must** have a unique ID
   - Prevents conflicts when multiple ad units are on the same page
   - Use `uniqueId` prop to provide explicit IDs: `uniqueId="adbanner-container-0"`

2. **Minimum Dimensions**
   - Uses `minWidth: "320px"` and `minHeight: "100px"` to ensure element has dimensions
   - Prevents "No slot size for availableWidth=0" errors
   - AdSense will adapt to actual dimensions once loaded

3. **Initialization Check**
   - Checks `data-adsbygoogle-status` attribute to prevent duplicate initialization
   - Only calls `push({})` once per ad unit

4. **Simple Timing**
   - Waits for `document.readyState === "complete"`
   - Small delay (300ms) to ensure element is in DOM
   - No complex retry logic needed due to minimum dimensions

### Usage Example

```tsx
// In Article component or any page component
{containerIndex !== 0 && (
  <AdBanner
    dataAdSlot="7165437828"
    uniqueId={`adbanner-container-${containerIndex}`}
  />
)}

{containerIndex === 0 && (
  <AdBanner
    dataAdSlot="7165437828"
    uniqueId="adbanner-container-0"
  />
)}
```

### Important Notes

- **Placement**: AdBanner should be placed **outside** flex containers or complex layouts to ensure proper dimensions
- **Unique IDs**: Always provide unique IDs when using multiple AdBanner instances on the same page
- **Ad Slot**: Each ad unit needs its own `dataAdSlot` value from your AdSense account
- **Not Auto Ads**: AdBanner is for specific ad units, not Auto Ads. Auto Ads still work independently if enabled

### Differences from Auto Ads

| Feature | Auto Ads | AdBanner (Specific Units) |
|---------|----------|---------------------------|
| Placement | Automatic | Manual (you control) |
| Initialization | Auto-scan on load | Manual `push({})` call |
| Navigation | Needs `push({})` on route change | Needs `push({})` on mount |
| Control | Google decides placement | You decide exact location |
| Use Case | Site-wide ads | Specific positions in content |

---

## Best Practices

### 1. Script Placement

✅ **Correct for Traditional HTML:**
- Place `<script>` tag directly in `<head>` section
- Include `async` attribute for non-blocking loading
- Include `crossOrigin="anonymous"` for CORS
- Add `?client=ca-pub-XXX` parameter to enable Auto Ads

✅ **Correct for Next.js 15 (Recommended):**
- Use Next.js `Script` component in root `layout.tsx`
- Can be placed in `<body>` section (Next.js injects to `<head>` automatically)
- Use `strategy="afterInteractive"` for optimal performance
- Include `async` attribute
- Include `id="adsbygoogle-init"` prop (required for Next.js Script component)
- Include `crossOrigin="anonymous"` for CORS
- Add `?client=ca-pub-4895395148287261` parameter to enable Auto Ads
- Current implementation: Component in `<body>`, script injected to `<head>` by Next.js

**Why `afterInteractive` for Next.js 15:**
- Still places script in `<head>` (meets Google's requirement)
- Better performance than `beforeInteractive` for third-party scripts
- Script persists across client-side navigations
- Works perfectly with `AdSenseRouter` component that calls `push({})` on route changes
- Provides Next.js optimizations (preloading, deduplication, caching)

❌ **Incorrect:**
- Script in `<body>` (causes warnings)
- Using Next.js Script component with `onLoad` callback in Server Component
- Using `beforeInteractive` for third-party scripts (unnecessary blocking)
- Multiple script tags
- Regular `<script>` tag in Next.js when `Script` component is available (loses optimizations)

### 2. Excluding Areas from Ads

Use `data-no-ad` attribute:

```html
<section data-no-ad>
  <h1>Hero Section</h1>
  <!-- No ads will appear here -->
</section>
```

### 3. Handling Navigation

**For Next.js App Router:**
- Use `usePathname()` to detect route changes
- Wait for content to render before calling `push({})`
- Use `requestAnimationFrame` for DOM readiness
- Add small delay for React rendering completion

**React/Next.js Best Practices for Third-Party Scripts:**

When integrating third-party scripts like AdSense that require direct DOM access:

1. **Use `useRef` for cleanup tracking** - Prevents memory leaks and ensures proper cleanup
2. **Check `document.readyState`** - More reliable than hardcoded delays
3. **Skip initial mount** - Let the script's auto-scan handle first load
4. **Use `requestAnimationFrame`** - Ensures React has painted before DOM access
5. **Poll for ready state** - Handle edge cases where document isn't immediately ready
6. **Proper cleanup** - Cancel all timers and animation frames in cleanup function
7. **Prevent race conditions** - Verify script tag exists in DOM before calling API (see below)

**Race Condition Prevention:**

A critical issue when working with third-party scripts is calling the API before the script has fully loaded. The AdSense script creates `window.adsbygoogle = []` early in its execution, but the script might still be loading or initializing.

**The Problem:**
- `window.adsbygoogle` array exists, but script might not be ready to process commands
- Calling `push({})` too early may result in commands being queued but never processed
- This can cause silent failures where ads never appear

**The Solution:**
Always verify the script tag exists in the DOM before calling `push({})`:

```typescript
const isScriptTagPresent = () => {
  if (typeof document === "undefined") return false;
  const script = document.querySelector(
    'script[src*="adsbygoogle.js"], script[id="adsbygoogle-init"]'
  );
  return script !== null;
};

const isAdSenseReady = () => {
  return (
    typeof window !== "undefined" &&
    window.adsbygoogle &&
    document.readyState === "complete" &&
    isScriptTagPresent() // ✅ Critical: Verify script tag exists
  );
};
```

**Why This Works:**
- Script tag presence confirms the script has loaded (Next.js `Script` component injects it)
- `window.adsbygoogle` existence confirms the script has initialized
- `document.readyState === "complete"` confirms the page is fully loaded
- All three checks together prevent race conditions

**Why Direct DOM Access is Necessary:**
- AdSense is a third-party global API (`window.adsbygoogle`)
- No React wrapper exists for AdSense Auto Ads
- Script needs to scan actual DOM after React renders
- This is standard pattern for third-party integrations (analytics, ads, etc.)

### 4. SSR Compatibility (Next.js 15)

**How It Works with SSR:**

1. **Server-Side Rendering:**
   - Component has `"use client"` directive → skipped on server
   - No server-side execution, no SSR errors
   - HTML sent to client without component logic

2. **Client Hydration:**
   - Component mounts on client after hydration
   - `useEffect` runs only on client (never on server)
   - All `window` and `document` checks prevent SSR errors

3. **Initial Mount Handling:**
   - Waits 2 seconds for AdSense auto-scan to run
   - If auto-scan doesn't trigger, manually triggers as fallback
   - Ensures ads load even if script loads slowly

4. **Subsequent Navigations:**
   - Client-side routing detected via `usePathname()`
   - Waits for React rendering + Suspense boundaries
   - Triggers re-scan when content is ready

**SSR Safety Features:**
- ✅ `"use client"` directive prevents server execution
- ✅ `typeof window !== "undefined"` guards all window access
- ✅ `typeof document !== "undefined"` guards all document access
- ✅ `useEffect` only runs on client after hydration
- ✅ Fallback mechanism ensures ads load on initial mount

### 5. Mobile Considerations

- Mobile devices may need slightly more time
- Viewport detection happens after content renders
- Ensure viewport meta tag is correct
- Test on actual mobile devices, not just DevTools

### 6. Error Handling

```javascript
try {
  if (window.adsbygoogle) {
    window.adsbygoogle.push({});
  }
} catch (err) {
  // Silently fail - AdSense handles errors internally
  // Don't log to avoid console spam
}
```

---

## Common Issues and Solutions

### Issue 1: Ads appear on first load but disappear on navigation

**Cause:** No re-scan triggered on route change

**Solution:** Call `push({})` after navigation, when content is ready

### Issue 2: Ads appear on desktop but not mobile

**Cause:** Timing issue - mobile needs more time for viewport detection

**Solution:** Ensure sufficient delay for content rendering on all devices

### Issue 3: Too many ads or ads in wrong places

**Cause:** AdSense learning period or incorrect settings

**Solution:** 
- Wait 24-48 hours for AdSense to optimize
- Adjust Auto Ads settings in AdSense dashboard
- Use `data-no-ad` to exclude specific areas

### Issue 4: "All 'ins' elements already have ads" error

**Cause:** Calling `push({})` multiple times on same page or same ad unit

**Solution:** 
- For Auto Ads: Ensure `push({})` is only called once per route change
- For AdBanner: Check `data-adsbygoogle-status` attribute before calling `push({})`

### Issue 5: "No slot size for availableWidth=0" error

**Cause:** AdSense trying to initialize ad unit before element has dimensions

**Solution:** 
- Add `minWidth` and `minHeight` styles to the `<ins>` element
- Ensure AdBanner is placed outside flex containers or complex layouts
- Wait for `document.readyState === "complete"` before initializing

---

## Technical Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    INITIAL PAGE LOAD                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Script loads from <head>                                   │
│  Creates window.adsbygoogle = []                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Wait for DOM ready (document.readyState === 'complete')   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  AUTOMATIC SCAN (only on initial load)                      │
│  - Analyze DOM structure                                    │
│  - Identify content areas                                    │
│  - Determine optimal placements                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Inject ad containers (<ins class="adsbygoogle">)          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Fetch ads from AdSense servers                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Render ads in containers                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              CLIENT-SIDE NAVIGATION                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Route changes (usePathname() detects)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  React renders new content                                   │
│  Suspense boundaries resolve                                 │
│  Async data loads                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Wait for content to be ready                               │
│  (requestAnimationFrame + delay)                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  MANUAL RE-SCAN: window.adsbygoogle.push({})               │
│  - Re-analyze current DOM                                   │
│  - Find new content areas                                    │
│  - Place ads in new locations                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Fetch and render new ads                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

1. **Auto Ads only auto-scan on initial page load** - not on client-side navigation
2. **Script placement** - Next.js `Script` component with `afterInteractive` injects to `<head>` automatically, even if component is in `<body>`
3. **`push({})` triggers manual re-scan** - needed for client-side navigation (Auto Ads) and ad unit initialization (AdBanner)
4. **Timing is critical** - must wait for content to be fully rendered
5. **Mobile needs more time** - viewport detection happens after rendering
6. **Use reactive checks + reasonable buffer** - Use `requestAnimationFrame` and `document.readyState` checks first (reactive), then add a reasonable buffer delay (500ms) to account for Suspense boundaries and async content that can't be detected programmatically
7. **One `push({})` per route change** - avoid multiple calls for Auto Ads
8. **Unique IDs required** - Each AdBanner instance must have a unique ID to prevent conflicts
9. **Minimum dimensions** - Use `minWidth` and `minHeight` on AdBanner elements to prevent "availableWidth=0" errors
10. **Placement matters** - Place AdBanner outside flex containers to ensure proper dimensions

---

## Current Implementation Details

### Files Structure

**`app/layout.tsx`:**
- Imports `AdSense` component
- Places `<AdSense />` in `<body>` section (line 223)
- Next.js automatically injects script to `<head>` due to `strategy="afterInteractive"`

**`components/adSence/AdSense.tsx`:**
- Next.js `Script` component with `strategy="afterInteractive"`
- Includes `async` attribute
- Script ID: `"adsbygoogle-init"`
- Publisher ID: `ca-pub-4895395148287261`

**`components/adSence/AdBanner.tsx`:**
- Client component for specific ad units
- Requires `uniqueId` prop for multiple instances
- Uses `minWidth: "320px"` and `minHeight: "100px"` to ensure dimensions
- Checks `data-adsbygoogle-status` before initializing
- Simple initialization: waits for document ready, then calls `push({})`

**`public/ads.txt`:**
```
google.com, pub-4895395148287261, DIRECT, f08c47fec0942fa0
```

### Ad Slot Configuration

- **Auto Ads**: Enabled via script parameter `?client=ca-pub-4895395148287261`
- **AdBanner Units**: Using ad slot `7165437828` (as of current implementation)

### Component Usage Pattern

```tsx
// In Article component or page components
{containerIndex !== 0 && (
  <AdBanner
    dataAdSlot="7165437828"
    uniqueId={`adbanner-container-${containerIndex}`}
  />
)}

{containerIndex === 0 && (
  <AdBanner
    dataAdSlot="7165437828"
    uniqueId="adbanner-container-0"
  />
)}
```

## References

- [Google AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Auto Ads Documentation](https://support.google.com/adsense/answer/9261309)
- [AdSense Program Policies](https://support.google.com/adsense/answer/48182)
- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)

---

*Last Updated: Based on current AdSense implementation (AdSense.tsx, AdBanner.tsx) and Next.js 15 App Router patterns*

