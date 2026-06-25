import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { parseProfileImageFormData } from "@/lib/utils/parseProfileFormData.ts";
import * as userService from "@/lib/services/userService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);

    let imageFile;
    try {
      imageFile = await parseProfileImageFormData(request);
    } catch {
      throw new ApiError(400, "Profile image file is required (field: imageUrl)", "VALIDATION_ERROR");
    }

    const user = await userService.updateProfileImage(session.id, imageFile);
    if (!user) {
      throw new ApiError(404, "User not found", "NOT_FOUND");
    }

    return ok({ user });
  });
}
