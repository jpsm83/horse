import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updatePersonalDetailsSchema } from "@/lib/validations/user.ts";
import { parseProfileFormData } from "@/lib/utils/parseProfileFormData.ts";
import * as userService from "@/lib/services/userService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const user = await userService.findById(session.id);
    if (!user) {
      throw new ApiError(404, "User not found", "NOT_FOUND");
    }
    return ok({ user: userService.toPublicUser(user.toObject() as Record<string, unknown>) });
  });
}

export async function PATCH(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const { profile, imageFile } = await parseProfileFormData(request);

      if (!profile && !imageFile) {
        throw new ApiError(400, "No profile fields or image provided", "VALIDATION_ERROR");
      }

      let user: userService.PublicUser | null = null;

      if (profile) {
        user = await userService.updatePersonalDetails(session.id, profile);
        if (!user) {
          throw new ApiError(404, "User not found", "NOT_FOUND");
        }
      }

      if (imageFile) {
        user = await userService.updateProfileImage(session.id, imageFile);
        if (!user) {
          throw new ApiError(404, "User not found", "NOT_FOUND");
        }
      }

      return ok({ user });
    }

    const input = updatePersonalDetailsSchema.parse(await request.json());
    const user = await userService.updatePersonalDetails(session.id, input);
    if (!user) {
      throw new ApiError(404, "User not found", "NOT_FOUND");
    }
    return ok({ user });
  });
}

export async function DELETE(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const user = await userService.softDelete(session.id);
    if (!user) {
      throw new ApiError(404, "User not found", "NOT_FOUND");
    }
    return ok({ user });
  });
}
