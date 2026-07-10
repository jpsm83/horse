"use server";

import { IUpdateProfileData, ISerializedUser } from "@/types/user";
import { IApiResponse } from "@/types/api";
import { cookies } from "next/headers";
import { getBaseUrl } from "@/lib/utils/getBaseUrl";

// Note: We use the API route instead of calling the service directly
// because file uploads require Cloudinary handling which is done in the route

const buildFormData = (profileData: IUpdateProfileData): FormData => {
  const formData = new FormData();

  if (profileData.username) formData.append("username", profileData.username);
  if (profileData.email) formData.append("email", profileData.email);
  if (profileData.role) formData.append("role", profileData.role);
  if (profileData.birthDate)
    formData.append("birthDate", profileData.birthDate);
  if (profileData.preferences) {
    formData.append("language", profileData.preferences.language);
    formData.append("region", profileData.preferences.region);
  }
  if (profileData.imageFile) {
    formData.append("imageFile", profileData.imageFile);
  }

  return formData;
};

const getCookieHeader = async (): Promise<string> => {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  return allCookies.map((c) => `${c.name}=${c.value}`).join("; ");
};

export async function updateUserProfile(
  userId: string | { toString(): string },
  profileData: IUpdateProfileData
): Promise<IApiResponse<ISerializedUser>> {
  try {
    const userIdStr = typeof userId === "string" ? userId : userId.toString();
    const formData = buildFormData(profileData);
    const cookieHeader = await getCookieHeader();
    const baseUrl = await getBaseUrl();

    const response = await fetch(`${baseUrl}/api/v1/users/${userIdStr}`, {
      method: "PATCH",
      headers: {
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to update user profile",
      };
    }

    return {
      success: true,
      message: result.message || "User profile updated successfully",
      data: result.data,
    };
  } catch (error) {
    console.error("[updateUserProfile] Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update user profile",
    };
  }
}
