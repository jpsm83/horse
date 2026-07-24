/**
 * Horse identity search for pedigree sire/dam pickers.
 *
 * `GET` `/api/v1/horses/search?q=` — exact match on normalized registryId,
 * microchipId, or passportNumber only.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";
import { Types } from "mongoose";
import { normalizeHorseIdentityValue } from "@/lib/utils/horseIdentity.ts";

function ownerDisplayName(personalDetails: Record<string, unknown> | undefined): string {
  const first =
    typeof personalDetails?.firstName === "string" ? personalDetails.firstName.trim() : "";
  const last =
    typeof personalDetails?.lastName === "string" ? personalDetails.lastName.trim() : "";
  const joined = [first, last].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  if (typeof personalDetails?.username === "string" && personalDetails.username.trim()) {
    return personalDetails.username.trim();
  }
  return "Unknown";
}

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    await requireAuthFromRequest(request);

    const raw = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    const q = normalizeHorseIdentityValue(raw);
    if (!q) {
      return ok({ results: [] });
    }

    const horses = await Horse.find({
      "registration.isActive": true,
      isActive: { $ne: false },
      $or: [{ registryId: q }, { microchipId: q }, { passportNumber: q }],
    })
      .select("name registeredName mainOwnerUserId registryId microchipId passportNumber")
      .limit(5)
      .lean();

    if (horses.length === 0) {
      return ok({ results: [] });
    }

    const ownerIds = [
      ...new Set(
        horses
          .map((h) => h.mainOwnerUserId)
          .filter(Boolean)
          .map((id) => String(id)),
      ),
    ];

    const owners = await User.find({
      _id: { $in: ownerIds.map((id) => new Types.ObjectId(id)) },
    })
      .select(
        "personalDetails.firstName personalDetails.lastName personalDetails.username personalDetails.email",
      )
      .lean();

    const ownerMap = new Map(
      owners.map((o) => [String(o._id), o as Record<string, unknown>]),
    );

    const results = horses.map((horse) => {
      const owner = ownerMap.get(String(horse.mainOwnerUserId));
      const personalDetails = owner?.personalDetails as Record<string, unknown> | undefined;
      const email =
        typeof personalDetails?.email === "string" ? personalDetails.email : "";

      return {
        id: String(horse._id),
        name: horse.name,
        registeredName: horse.registeredName ?? undefined,
        ownerName: ownerDisplayName(personalDetails),
        ownerEmail: email,
        ownerId: String(horse.mainOwnerUserId),
      };
    });

    return ok({ results });
  });
}
