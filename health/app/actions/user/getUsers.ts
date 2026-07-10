"use server";

import { IUserResponse } from "@/types/user";
import { getUsersService } from "@/lib/services/users";

export async function getUsers(): Promise<IUserResponse> {
  try {
    const users = await getUsersService();

    if (!users || users.length === 0) {
      return {
        success: false,
        message: "No users found!",
      };
    }

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Get all users failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Get all users failed!",
    };
  }
}
