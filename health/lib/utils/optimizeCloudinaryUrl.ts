export function optimizeCloudinaryUrl(originalUrl: string, quality: 'auto' | number = 'auto'): string {
  if (!originalUrl) return originalUrl;
  try {
    // Only modify Cloudinary URLs
    const isCloudinary = originalUrl.includes('res.cloudinary.com');
    if (!isCloudinary) return originalUrl;

    // Insert transformation after '/upload/' if not already present
    const marker = '/upload/';
    const idx = originalUrl.indexOf(marker);
    if (idx === -1) return originalUrl;

    const prefix = originalUrl.substring(0, idx + marker.length);
    const suffix = originalUrl.substring(idx + marker.length);

    // If there are already transformations, append ours if missing
    const hasFormat = /f_\w+/.test(suffix);
    const hasQuality = /q_\w+/.test(suffix);
    const parts: string[] = [];
    if (!hasFormat) parts.push('f_auto');
    if (!hasQuality) parts.push(`q_${quality}`);

    if (parts.length === 0) return originalUrl; // nothing to add

    const transform = parts.join(',');
    return `${prefix}${transform}/${suffix}`;
  } catch {
    return originalUrl;
  }
}


