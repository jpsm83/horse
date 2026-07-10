"use server";

import { ICreateUserParams, ICreateUserResponse } from "@/types/user";
import { getBaseUrl } from "@/lib/utils/getBaseUrl";

// Note: This action calls the API route because the route handles
// FormData parsing, file uploads, and email sending.

export async function createUser(
  params: ICreateUserParams
): Promise<ICreateUserResponse> {
  try {
    // For file uploads, we need to use FormData
    const formData = new FormData();
    formData.append("username", params.username);
    formData.append("email", params.email);
    formData.append("password", params.password);
    formData.append("role", params.role);
    formData.append("birthDate", params.birthDate);
    formData.append("language", params.language);
    formData.append("region", params.region);
    if (params.imageFile) {
      formData.append("imageFile", params.imageFile);
    }

    const baseUrl = await getBaseUrl();

    const response = await fetch(`${baseUrl}/api/v1/users`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to create user",
      };
    }

    return {
      success: true,
      message: result.message || "User created successfully",
    };
  } catch (error) {
    console.error("Create user failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Create user failed!",
    };
  }
}