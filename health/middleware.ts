import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { translateRouteToEnglish, translateRouteToLocale, isCategoryRoute } from './lib/utils/routeTranslation';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract path segments
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // Check if we have a locale prefix
  const firstSegment = pathSegments[0];
  const isLocale = routing.locales.includes(firstSegment as (typeof routing.locales)[number]);
  
  if (isLocale && pathSegments.length > 1) {
    const locale = firstSegment;
    const routeSegment = pathSegments[1];
    
    // Translate the route segment to English
    const englishRoute = translateRouteToEnglish(routeSegment);
    const isCategory = isCategoryRoute(routeSegment);
    
    if (locale !== 'en') {
      // Route is translated (e.g., "perfil" or "saude")
      if (englishRoute !== routeSegment) {
        // For static routes, rewrite to English internally
        if (!isCategory) {
          const newPathSegments = [locale, englishRoute, ...pathSegments.slice(2)];
          const newPath = '/' + newPathSegments.join('/');
          // Rewrite the URL internally (browser URL stays as /pt/perfil, but Next.js serves /pt/profile)
          const rewriteUrl = new URL(newPath, request.url);
          rewriteUrl.search = request.nextUrl.search; // Preserve query string
          // Create a new request with the English route for intlMiddleware
          const modifiedRequest = new NextRequest(rewriteUrl, request);
          // Process with intlMiddleware using the English route
          const response = intlMiddleware(modifiedRequest);
          // Apply rewrite to preserve the original URL in browser
          const rewriteResponse = NextResponse.rewrite(rewriteUrl);
          // Copy all headers and status from intlMiddleware response
          response.headers.forEach((value, key) => {
            rewriteResponse.headers.set(key, value);
          });
          // Preserve status code if it's a redirect
          if (response.status >= 300 && response.status < 400) {
            return response; // Return redirect as-is
          }
          return rewriteResponse;
        }
        // Categories already work via [category] dynamic route, no rewrite needed
      } else {
        // Route is English but locale is not English - redirect to translated version
        const translatedRoute = translateRouteToLocale(englishRoute, locale);
        
        if (translatedRoute !== englishRoute) {
          const newPathSegments = [locale, translatedRoute, ...pathSegments.slice(2)];
          const newPath = '/' + newPathSegments.join('/');
          // Preserve query parameters when redirecting
          const redirectUrl = new URL(newPath, request.url);
          redirectUrl.search = request.nextUrl.search; // Preserve query string
          // Redirect to translated route (this will be handled by intlMiddleware on next request)
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
  }
  
  // Let next-intl handle locale routing
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};