import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/app/api/utils/handleApiError";
import { confirmNewsletterSubscriptionService } from "@/lib/services/subscribers";

// @desc    Confirm newsletter subscription with token
// @route   POST /api/v1/subscribers/confirm-newsletter-subscription
// @access  Public
export const POST = async (req: NextRequest) => {
  try {
    const { token, email } = await req.json();

    // Validate required fields
    if (!token || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Token and email are required!",
          error: "MISSING_PARAMETERS",
        },
        { status: 400 }
      );
    }

    try {
      await confirmNewsletterSubscriptionService({ token, email });

      return NextResponse.json(
        {
          success: true,
          message: "Newsletter subscription confirmed successfully!",
        },
        { status: 200 }
      );
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";
      
      if (errorMessage.includes("Invalid or expired") || errorMessage.includes("INVALID_TOKEN")) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid or expired confirmation link!",
            error: "INVALID_TOKEN",
          },
          { status: 400 }
        );
      }
      
      throw serviceError;
    }
  } catch (error) {
    console.error("Newsletter confirmation error:", error);
    return handleApiError("Newsletter subscription confirmation failed!", error as string);
  }
};
