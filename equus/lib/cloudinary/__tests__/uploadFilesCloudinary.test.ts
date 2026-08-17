import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildCloudinaryPath } from "@/lib/cloudinary/constants.ts";
import uploadFilesCloudinary from "@/lib/cloudinary/uploadFilesCloudinary.ts";

const uploadMock = vi.fn();

vi.mock("cloudinary", () => ({
  v2: {
    uploader: {
      upload: (...args: unknown[]) => uploadMock(...args),
    },
  },
}));

vi.mock("@/lib/cloudinary/cloudinaryConfig.ts", () => ({
  default: vi.fn(),
}));

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  return {
    ...actual,
    randomUUID: vi.fn(() => "00000000-0000-4000-8000-000000000001"),
  };
});

describe("buildCloudinaryPath", () => {
  it("prefixes preset and normalizes leading slash", () => {
    expect(buildCloudinaryPath("/users/abc")).toBe("equus/users/abc");
    expect(buildCloudinaryPath("users/abc")).toBe("equus/users/abc");
  });
});

describe("uploadFilesCloudinary", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    vi.mocked(randomUUID).mockReturnValue("00000000-0000-4000-8000-000000000001");
  });

  it("uploads with folder and public_id under equus/users/{id}/ (signed, no preset)", async () => {
    uploadMock.mockResolvedValue({
      public_id: "equus/users/test-user-id/00000000-0000-4000-8000-000000000001",
      secure_url:
        "https://res.cloudinary.com/demo/image/upload/v1/equus/users/test-user-id/00000000-0000-4000-8000-000000000001.jpg",
    });

    const result = await uploadFilesCloudinary({
      folder: "/users/test-user-id",
      filesArr: [{ buffer: Buffer.from("fake"), mimeType: "image/jpeg" }],
      onlyImages: true,
    });

    expect(uploadMock).toHaveBeenCalledOnce();
    const [, options] = uploadMock.mock.calls[0] as [
      string,
      { folder: string; public_id: string; upload_preset?: string },
    ];
    expect(options.folder).toBe("equus/users/test-user-id");
    expect(options.public_id).toBe("equus/users/test-user-id/00000000-0000-4000-8000-000000000001");
    expect(options.upload_preset).toBeUndefined();
    expect(result).toEqual([
      "https://res.cloudinary.com/demo/image/upload/v1/equus/users/test-user-id/00000000-0000-4000-8000-000000000001.jpg",
    ]);
  });

  it("rejects non-image files when onlyImages is true", async () => {
    const result = await uploadFilesCloudinary({
      folder: "/users/test-user-id",
      filesArr: [{ buffer: Buffer.from("fake"), mimeType: "application/pdf" }],
      onlyImages: true,
    });

    expect(result).toBe("Only images can be uploaded!");
    expect(uploadMock).not.toHaveBeenCalled();
  });
});
