import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { getBaseUrlFromRequest } from "@/lib/utils/getBaseUrl";

// @desc    Unsubscribe from newsletter
// @route   POST /api/v1/subscribers/newsletter-unsubscribe
// @access  Public
export const POST = async (req: NextRequest) => {
  try {
    const { email, token } = await req.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email address is required",
        },
        { status: 400 }
      );
    }

    // Forward to main subscribers route
    const baseUrl = getBaseUrlFromRequest(req);
    
    const response = await fetch(`${baseUrl}/api/v1/subscribers`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, token }),
    });

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return handleApiError("Newsletter unsubscription failed!", error as string);
  }
};
