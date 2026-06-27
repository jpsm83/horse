/**
 * Cloudinary upload preset and path prefix for all Equus assets.
 * Layout: `{preset}/users/{userId}/…`, `{preset}/horses/{horseId}/…`, etc.
 *
 * Server uploads use signed API calls (api_secret) — no upload_preset, so subfolders
 * are not flattened by preset settings (equus preset locks Media Library to `equus/`).
 */
export const CLOUDINARY_UPLOAD_PRESET =
  process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || "equus";

/** e.g. buildCloudinaryPath("/users/abc") → "equus/users/abc" */
export function buildCloudinaryPath(relativePath: string): string {
  const segment = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${CLOUDINARY_UPLOAD_PRESET}${segment}`;
}
