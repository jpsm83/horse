import connectDb from "@/lib/db.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
import { v2 as cloudinary } from "cloudinary";
import Document from "@/models/Document.ts";

type RouteContext = { params: Promise<{ docId: string }> };

export async function GET(request: Request, context: RouteContext) {
  await connectDb();
  const session = await requireAuthFromRequest(request);
  const { docId } = await context.params;

  const doc = await Document.findById(docId).select("storagePublicId fileUrl fileName mimeType").lean();
  if (!doc) return new Response("Not found", { status: 404 });

  configureCloudinary();

  const signedUrl = doc.storagePublicId
    ? cloudinary.url(doc.storagePublicId, { secure: true, sign_url: true, resource_type: "auto" })
    : doc.fileUrl;

  const fileResponse = await fetch(signedUrl);
  if (!fileResponse.ok) return new Response("Storage error", { status: 502 });

  const blob = await fileResponse.blob();

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": (doc.mimeType as string) || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName as string)}"`,
    },
  });
}
