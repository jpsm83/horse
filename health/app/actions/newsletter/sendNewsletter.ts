'use server';

import { getBaseUrl } from "@/lib/utils/getBaseUrl";

// Note: This action calls the API route because the route handles
// the email sending orchestration. The service layer only provides
// the subscriber data. Email sending is handled at the route level.

export interface SendNewsletterResult {
  success: boolean;
  message: string;
  error?: string;
  sentCount?: number;
}

export default async function sendNewsletterAction(): Promise<SendNewsletterResult> {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/newsletter/send-newsletter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to send newsletter",
        error: result.error || "NEWSLETTER_SEND_FAILED",
      };
    }

    return result;
  } catch (error) {
    console.error("Send newsletter error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong while sending newsletter.",
      error: "NEWSLETTER_SEND_FAILED"
    };
  }
}
