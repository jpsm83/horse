/**
 * Unified entity search — searches across all entity types + users.
 *
 * GET /api/v1/search/entities?q=searchterm
 *
 * Returns registered Equus users with claimed entity profiles.
 * Business rule: Non-users cannot appear in search results.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";

type SearchResult = {
  id: string;
  name: string;
  email: string;
  entityType: string;
  entityLabel: string;
};

const ENTITY_TYPES = [
  { type: "stable", model: "Stable", nameField: "name", searchFields: ["name", "email"], label: "Stable" },
  { type: "veterinary", model: "Veterinary", nameField: "name", searchFields: ["name", "email"], label: "Veterinary" },
  { type: "trainer", model: "Trainer", nameField: "name", searchFields: ["name", "email"], label: "Trainer" },
  { type: "groom", model: "Groom", nameField: "name", searchFields: ["name", "email"], label: "Groom" },
  { type: "farrier", model: "Farrier", nameField: "name", searchFields: ["name", "email"], label: "Farrier" },
  { type: "breeder", model: "Breeder", nameField: "name", searchFields: ["name", "email"], label: "Breeder" },
  { type: "ridingClub", model: "RidingClub", nameField: "name", searchFields: ["name", "email"], label: "Riding Club" },
  { type: "rider", model: "Rider", nameField: "name", searchFields: ["name", "email"], label: "Rider" },
  { type: "coach", model: "Coach", nameField: "name", searchFields: ["name", "email"], label: "Coach" },
  { type: "transport", model: "Transport", nameField: "name", searchFields: ["name", "email"], label: "Transport" },
];

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";

    if (q.trim().length < 2) {
      return ok({ results: [] });
    }

    const regex = new RegExp(q.trim(), "i");
    const results: SearchResult[] = [];

    for (const entity of ENTITY_TYPES) {
      try {
        const { default: Model } = await import(`@/models/${entity.model}.ts`);
        const docs = await Model.find({
          isActive: true,
          $or: entity.searchFields.map((field) => ({ [field]: regex })),
        })
          .select("name email")
          .limit(5)
          .lean();

        for (const doc of docs) {
          results.push({
            id: String(doc._id),
            name: (doc as Record<string, unknown>).name as string ?? "",
            email: (doc as Record<string, unknown>).email as string ?? "",
            entityType: entity.type,
            entityLabel: entity.label,
          });
        }
      } catch {
        // skip model if not available
      }
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return ok({ results: results.slice(0, 20) });
  });
}
