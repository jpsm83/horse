import { describe, expect, it } from "vitest";
import { assertCloudinaryUploadUrls, assertCloudinaryDeleteSuccess } from "@/lib/cloudinary/assertUpload.ts";
import { ApiError } from "@/lib/api/errors.ts";

describe("cloudinary assertUpload", () => {
  it("assertCloudinaryUploadUrls accepts valid https URLs", () => {
    const urls = assertCloudinaryUploadUrls(["https://res.cloudinary.com/demo/image/upload/v1/equus/users/1.jpg"]);
    expect(urls).toHaveLength(1);
  });

  it("assertCloudinaryUploadUrls rejects error strings", () => {
    expect(() => assertCloudinaryUploadUrls("Only images can be uploaded!")).toThrow(ApiError);
    expect(() => assertCloudinaryUploadUrls([])).toThrow(ApiError);
  });

  it("assertCloudinaryDeleteSuccess accepts true", () => {
    expect(() => assertCloudinaryDeleteSuccess(true)).not.toThrow();
  });

  it("assertCloudinaryDeleteSuccess rejects failure messages", () => {
    expect(() => assertCloudinaryDeleteSuccess("DeleteCloudinaryImage failed!")).toThrow(ApiError);
  });
});
