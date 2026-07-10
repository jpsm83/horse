"use server";

import { ISerializedArticle } from "@/types/article";
import { getArticleBySlugService } from "@/lib/services/articles";
import { FieldProjectionType } from "@/app/api/utils/fieldProjections";

export async function getArticleBySlug(
  slug: string,
  locale = "en",
  fields: FieldProjectionType = "full"
): Promise<ISerializedArticle | null> {
  try {
    return await getArticleBySlugService(slug, locale, fields);
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    // Return null instead of throwing error (matching service behavior)
    return null;
  }
}
