"use server";

import { IGetSubscribersResponse } from "@/types/subscriber";
import { getSubscribersService } from "@/lib/services/subscribers";

export async function getSubscribers(): Promise<IGetSubscribersResponse> {
  try {
    const subscribers = await getSubscribersService();

    if (!subscribers || subscribers.length === 0) {
      return {
        success: false,
        message: "No subscribers found!",
      };
    }

    return {
      success: true,
      data: subscribers,
    };
  } catch (error) {
    console.error("Get subscribers failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Get subscribers failed!",
    };
  }
}
