"use server";

import { IUserResponse } from "@/types/user";
import { getUserByIdService } from "@/lib/services/users";

export async function getUserById(userId: string): Promise<IUserResponse> {
  try {
    const user = await getUserByIdService(userId);

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Get user by userId failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Get user by userId failed!";

    if (errorMessage.includes("not found")) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
