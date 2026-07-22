import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
import { cloudinaryResourceTypeFromMime } from "@/lib/cloudinary/resourceTypeFromMime.ts";
import { v2 as cloudinary } from "cloudinary";

export type CloudinaryResourceType = "image" | "video" | "raw";

/** Derive Cloudinary resource type from a stored delivery URL path segment. */
export function resourceTypeFromDeliveryUrl(fileUrl: string): CloudinaryResourceType | null {
  if (fileUrl.includes("/raw/upload/")) return "raw";
  if (fileUrl.includes("/video/upload/")) return "video";
  if (fileUrl.includes("/image/upload/")) return "image";
  return null;
}

/** File extension without dot — required by private_download_url. */
export function formatFromFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === fileName.length - 1) return "";
  return fileName.slice(lastDot + 1).toLowerCase();
}

export type DocumentDownloadInput = {
  storagePublicId?: string;
  fileUrl: string;
  fileName: string;
  mimeType?: string;
};

/**
 * Builds ordered download URLs for horse documents:
 * 1. Cloudinary API private_download_url (signed, attachment)
 * 2. CDN delivery URL with fl_attachment (public upload type)
 * 3. Stored fileUrl (legacy fallback)
 */
export function buildDocumentDownloadUrls(input: DocumentDownloadInput): string[] {
  const urls: string[] = [];
  const resourceType =
    resourceTypeFromDeliveryUrl(input.fileUrl) ??
    cloudinaryResourceTypeFromMime(input.mimeType);
  const format = formatFromFileName(input.fileName);

  if (input.storagePublicId && format) {
    configureCloudinary();

    urls.push(
      cloudinary.utils.private_download_url(input.storagePublicId, format, {
        resource_type: resourceType,
        type: "upload",
        attachment: true,
      }),
    );

    const cdnUrl = cloudinary.url(input.storagePublicId, {
      resource_type: resourceType,
      type: "upload",
      secure: true,
      flags: `attachment:${encodeURIComponent(input.fileName)}`,
    });
    if (!urls.includes(cdnUrl)) {
      urls.push(cdnUrl);
    }
  }

  if (input.fileUrl && !urls.includes(input.fileUrl)) {
    urls.push(input.fileUrl);
  }

  return urls;
}

/** @deprecated Use buildDocumentDownloadUrls — kept for service-layer naming consistency. */
export const buildHorseDocumentDeliveryUrls = buildDocumentDownloadUrls;
