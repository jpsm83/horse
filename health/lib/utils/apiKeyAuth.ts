import { NextResponse } from "next/server";

/**
 * Validates API key from request headers
 * @param request - The incoming request
 * @returns API key if valid, null if invalid or missing
 */
export function validateApiKey(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader) {
    return null;
  }

  // Check for "Bearer API_KEY" format
  const token = authHeader.replace(/^Bearer\s+/i, "");
  
  if (!token) {
    return null;
  }

  // Validate against environment variable
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) {
    console.error("API_KEY environment variable not set");
    return null;
  }

  if (token !== validApiKey) {
    return null;
  }

  return token;
}

/**
 * Middleware function to check API key authentication
 * @param request - The incoming request
 * @returns NextResponse with error if invalid, null if valid
 */
export function checkApiKeyAuth(request: Request): NextResponse | null {
  const apiKey = validateApiKey(request);
  
  if (!apiKey) {
    return new NextResponse(
      JSON.stringify({
        message: "Invalid or missing API key. Please provide a valid API key in the Authorization header.",
        error: "UNAUTHORIZED"
      }),
      { 
        status: 401, 
        headers: { 
          "Content-Type": "application/json",
          "WWW-Authenticate": "Bearer"
        } 
      }
    );
  }

  return null; // Valid API key
}

/**
 * Alternative authentication that accepts either session or API key
 * @param request - The incoming request
 * @param session - The NextAuth session (can be null)
 * @returns NextResponse with error if both auth methods fail, null if either succeeds
 */
export function checkAuthWithApiKey(request: Request, session: unknown): NextResponse | null {
  // If session exists and has a user, use session authentication
  if (session && typeof session === 'object' && session !== null && 'user' in session) {
    const sessionObj = session as { user?: { id?: string } };
    if (sessionObj.user && sessionObj.user.id) {
      return null; // Valid session
    }
  }

  // If no valid session, try API key authentication
  return checkApiKeyAuth(request);
}
