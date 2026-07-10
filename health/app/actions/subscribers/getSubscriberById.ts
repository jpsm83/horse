"use server";

import { IGetSubscriberByIdResponse } from "@/types/subscriber";
import { getSubscriberByIdService } from "@/lib/services/subscribers";

export async function getSubscriberById(
  subscriberId: string
): Promise<IGetSubscriberByIdResponse> {
  try {
    const subscriber = await getSubscriberByIdService(subscriberId);

    if (!subscriber) {
      return {
        success: false,
        message: "Subscriber not found",
      };
    }

    return {
      success: true,
      data: subscriber,
    };
  } catch (error) {
    console.error("Get subscriber by ID failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Get subscriber by ID failed!";
    
    // Check if it's a validation error
    if (errorMessage.includes("Invalid subscriber ID format")) {
      return {
        success: false,
        message: "Invalid subscriber ID format",
      };
    }
    
    // Check if it's a not found error
    if (errorMessage.includes("not found")) {
      return {
        success: false,
        message: "Subscriber not found",
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
