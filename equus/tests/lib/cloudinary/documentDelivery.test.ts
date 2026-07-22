import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildDocumentDownloadUrls,
  formatFromFileName,
  resourceTypeFromDeliveryUrl,
} from "@/lib/cloudinary/documentDelivery";

const { mockPrivateDownloadUrl, mockUrl } = vi.hoisted(() => ({
  mockPrivateDownloadUrl: vi.fn(),
  mockUrl: vi.fn(),
}));

vi.mock("@/lib/cloudinary/cloudinaryConfig", () => ({ default: vi.fn() }));
vi.mock("cloudinary", () => ({
  v2: {
    url: mockUrl,
    utils: {
      private_download_url: mockPrivateDownloadUrl,
    },
    config: vi.fn(),
  },
}));

describe("resourceTypeFromDeliveryUrl", () => {
  it("parses image delivery URLs", () => {
    expect(
      resourceTypeFromDeliveryUrl(
        "https://res.cloudinary.com/demo/image/upload/v1/equus/horses/1/doc.pdf",
      ),
    ).toBe("image");
  });

  it("parses raw delivery URLs", () => {
    expect(
      resourceTypeFromDeliveryUrl(
        "https://res.cloudinary.com/demo/raw/upload/v1/equus/horses/1/doc.docx",
      ),
    ).toBe("raw");
  });

  it("parses video delivery URLs", () => {
    expect(
      resourceTypeFromDeliveryUrl(
        "https://res.cloudinary.com/demo/video/upload/v1/equus/horses/1/clip.mp4",
      ),
    ).toBe("video");
  });

  it("returns null for non-Cloudinary URLs", () => {
    expect(resourceTypeFromDeliveryUrl("https://example.com/file.pdf")).toBeNull();
  });
});

describe("formatFromFileName", () => {
  it("returns lowercase extension without dot", () => {
    expect(formatFromFileName("Passport.PDF")).toBe("pdf");
  });

  it("returns empty string when no extension", () => {
    expect(formatFromFileName("noextension")).toBe("");
  });
});

describe("buildDocumentDownloadUrls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrivateDownloadUrl.mockReturnValue(
      "https://api.cloudinary.com/v1_1/demo/image/download?public_id=doc123&format=pdf",
    );
    mockUrl.mockReturnValue(
      "https://res.cloudinary.com/demo/image/upload/fl_attachment:passport.pdf/equus/horses/test/doc123",
    );
  });

  it("uses private_download_url first with upload type and attachment", () => {
    const urls = buildDocumentDownloadUrls({
      storagePublicId: "equus/horses/test/documents/doc123",
      fileUrl: "https://res.cloudinary.com/demo/image/upload/v1/doc123.pdf",
      fileName: "passport.pdf",
      mimeType: "application/pdf",
    });

    expect(mockPrivateDownloadUrl).toHaveBeenCalledWith(
      "equus/horses/test/documents/doc123",
      "pdf",
      expect.objectContaining({
        resource_type: "image",
        type: "upload",
        attachment: true,
      }),
    );
    expect(mockUrl).toHaveBeenCalledWith(
      "equus/horses/test/documents/doc123",
      expect.objectContaining({
        resource_type: "image",
        type: "upload",
        secure: true,
        flags: "attachment:passport.pdf",
      }),
    );
    expect(mockUrl).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sign_url: true }),
    );
    expect(urls).toEqual([
      "https://api.cloudinary.com/v1_1/demo/image/download?public_id=doc123&format=pdf",
      "https://res.cloudinary.com/demo/image/upload/fl_attachment:passport.pdf/equus/horses/test/doc123",
      "https://res.cloudinary.com/demo/image/upload/v1/doc123.pdf",
    ]);
  });

  it("uses raw resource_type from delivery URL for office documents", () => {
    buildDocumentDownloadUrls({
      storagePublicId: "equus/horses/test/documents/doc456",
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1/doc456.docx",
      fileName: "report.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    expect(mockPrivateDownloadUrl).toHaveBeenCalledWith(
      "equus/horses/test/documents/doc456",
      "docx",
      expect.objectContaining({ resource_type: "raw" }),
    );
    expect(mockUrl).toHaveBeenCalledWith(
      "equus/horses/test/documents/doc456",
      expect.objectContaining({ resource_type: "raw" }),
    );
  });

  it("falls back to fileUrl only when storagePublicId is missing", () => {
    const urls = buildDocumentDownloadUrls({
      fileUrl: "https://res.cloudinary.com/demo/image/upload/v1/legacy.pdf",
      fileName: "legacy.pdf",
    });

    expect(mockPrivateDownloadUrl).not.toHaveBeenCalled();
    expect(mockUrl).not.toHaveBeenCalled();
    expect(urls).toEqual(["https://res.cloudinary.com/demo/image/upload/v1/legacy.pdf"]);
  });

  it("skips API/CDN URLs when fileName has no extension", () => {
    const urls = buildDocumentDownloadUrls({
      storagePublicId: "equus/horses/test/documents/doc123",
      fileUrl: "https://res.cloudinary.com/demo/image/upload/v1/doc123",
      fileName: "noextension",
      mimeType: "application/pdf",
    });

    expect(mockPrivateDownloadUrl).not.toHaveBeenCalled();
    expect(mockUrl).not.toHaveBeenCalled();
    expect(urls).toEqual(["https://res.cloudinary.com/demo/image/upload/v1/doc123"]);
  });
});
