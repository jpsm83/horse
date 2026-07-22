import { describe, it, expect } from "vitest";
import { cloudinaryResourceTypeFromMime } from "@/lib/cloudinary/resourceTypeFromMime";

describe("cloudinaryResourceTypeFromMime", () => {
  it("maps PDF to image", () => {
    expect(cloudinaryResourceTypeFromMime("application/pdf")).toBe("image");
  });

  it("maps image MIME types to image", () => {
    expect(cloudinaryResourceTypeFromMime("image/jpeg")).toBe("image");
  });

  it("maps video MIME types to video", () => {
    expect(cloudinaryResourceTypeFromMime("video/mp4")).toBe("video");
  });

  it("maps office documents to raw", () => {
    expect(
      cloudinaryResourceTypeFromMime(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("raw");
  });

  it("defaults to raw when mime type is missing", () => {
    expect(cloudinaryResourceTypeFromMime(undefined)).toBe("raw");
  });
});
