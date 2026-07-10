"use server";

import { IDeleteUserResponse } from "@/types/user";
import { deactivateUserService } from "@/lib/services/users";

export async function deleteUser(
  userId: string
): Promise<IDeleteUserResponse> {
  try {
    await deactivateUserService(userId);

    return {
      success: true,
      message: "User deactivated successfully",
    };
  } catch (error) {
    console.error("Deactivate user failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Deactivate user failed!";

    if (errorMessage.includes("not found")) {
      return {
        success: false,
        message: "User not found!",
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
