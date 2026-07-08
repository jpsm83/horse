import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { resetOptionalUserCache } from "@/lib/api/auth/session";
import type { PublicUser, UpdatePersonalDetailsInput } from "@/lib/services/userService";

/** Deactivate the signed-in account (`DELETE /api/v1/users/me`). Clears REST session cookies server-side. */
export async function deactivateCurrentUserAccount(): Promise<{ user: PublicUser }> {
  const data = await parseApiResponse<{ user: PublicUser }>(
    await fetchWithAuth("/api/v1/users/me", { method: "DELETE" }, { notifyOnExpired: true }),
  );
  resetOptionalUserCache();
  return data;
}

/** Update profile fields; optional avatar upload uses multipart PATCH. */
export async function updateUserProfile(
  input: UpdatePersonalDetailsInput,
  imageFile?: File,
): Promise<{ user: PublicUser }> {
  let response: Response;

  if (imageFile) {
    const formData = new FormData();
    formData.append("imageUrl", imageFile);
    formData.append("profile", JSON.stringify(input));

    response = await fetchWithAuth(
      "/api/v1/users/me",
      { method: "PATCH", body: formData },
      { notifyOnExpired: true },
    );
  } else {
    response = await fetchWithAuth(
      "/api/v1/users/me",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
      { notifyOnExpired: true },
    );
  }

  const data = await parseApiResponse<{ user: PublicUser }>(response);
  resetOptionalUserCache();
  return data;
}
