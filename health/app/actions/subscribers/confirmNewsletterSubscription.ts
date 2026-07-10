"use server";

import { confirmNewsletterSubscriptionService } from "@/lib/services/subscribers";

export interface NewsletterConfirmResult {
  success: boolean;
  message: string;
  error?: string;
}

export default async function confirmNewsletterSubscriptionAction(
  token: string,
  email: string
): Promise<NewsletterConfirmResult> {
  try {
    if (!token || !email) {
      return {
        success: false,
        message: "Token and email are required!",
        error: "MISSING_PARAMETERS",
      };
    }

    await confirmNewsletterSubscriptionService({ token, email });

    return {
      success: true,
      message: "Newsletter subscription confirmed successfully!",
    };
  } catch (error) {
    console.error("Newsletter confirmation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
    
    if (errorMessage.includes("Invalid or expired") || errorMessage.includes("INVALID_TOKEN")) {
      return {
        success: false,
        message: "Invalid or expired confirmation link!",
        error: "INVALID_TOKEN",
      };
    }
    
    return {
      success: false,
      message: errorMessage,
      error: "CONFIRMATION_FAILED",
    };
  }
}
