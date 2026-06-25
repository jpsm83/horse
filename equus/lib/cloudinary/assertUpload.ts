import { ApiError } from "../api/errors.ts";

export function assertCloudinaryUploadUrls(result: string | string[]): string[] {
  if (
    typeof result === "string" ||
    result.length === 0 ||
    !result.every((url) => url.includes("https://"))
  ) {
    throw new ApiError(400, `Error uploading image: ${result}`, "UPLOAD_FAILED");
  }
  return result;
}

export function assertCloudinaryDeleteSuccess(result: boolean | string): void {
  if (result !== true) {
    throw new ApiError(400, String(result), "UPLOAD_FAILED");
  }
}
