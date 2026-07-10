"use server";

import {
  IUpdateSubscriberPreferencesParams,
  IUpdateSubscriberPreferencesResponse,
} from "@/types/subscriber";
import { updateSubscriberPreferencesService } from "@/lib/services/subscribers";

export async function updateSubscriberPreferences(
  subscriberId: string,
  params: IUpdateSubscriberPreferencesParams
): Promise<IUpdateSubscriberPreferencesResponse> {
  try {
    const { subscriptionPreferences } = params;

    const updatedSubscriber = await updateSubscriberPreferencesService({
      subscriberId,
      subscriptionPreferences,
    });

    return {
      success: true,
      message: "Subscriber preferences updated successfully",
      data: updatedSubscriber,
    };
  } catch (error) {
    console.error("Update subscriber preferences failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Update subscriber preferences failed!";
    
    // Check for specific error types
    if (errorMessage.includes("Invalid subscriber ID format")) {
      return {
        success: false,
        message: "Invalid subscriber ID format",
      };
    }
    
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
