export type UploadResult = {
  url: string;
  error?: string;
};

export async function uploadFiles(
  files: File[],
  signal?: AbortSignal,
): Promise<UploadResult[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/v1/media/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      (body as { error?: { message?: string } }).error?.message ??
      "Upload failed";
    return files.map(() => ({ url: "", error: message }));
  }

  const data = await response.json() as { data: { urls: string[] } };
  const urls = data.data?.urls ?? [];

  return files.map((_, i) => ({
    url: urls[i] ?? "",
    error: urls[i] ? undefined : "Upload failed",
  }));
}
