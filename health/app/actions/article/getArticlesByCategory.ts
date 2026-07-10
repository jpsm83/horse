"use server";

import { IGetArticlesParams, ISerializedArticle } from "@/types/article";
import { IPaginatedResponse } from "@/types/api";
import {
  getArticlesService,
  GetArticlesServiceParams,
} from "@/lib/services/articles";
import { FieldProjectionType } from "@/app/api/utils/fieldProjections";
import { translateCategoryToEnglish } from "@/lib/utils/routeTranslation";
import { mainCategories } from "@/lib/constants";

export async function getArticlesByCategory(
  params: IGetArticlesParams & { category: string; skipCount?: boolean; fields?: FieldProjectionType }
): Promise<IPaginatedResponse<ISerializedArticle>> {
  try {
    // Translate category to English (defensive - handles both English and translated)
    const englishCategory = translateCategoryToEnglish(params.category);
    
    // Validate category exists in mainCategories
    if (!mainCategories.includes(englishCategory)) {
      console.warn(`Invalid category: ${params.category} (translated to: ${englishCategory})`);
      return {
        page: params.page || 1,
        limit: params.limit || 9,
        totalDocs: 0,
        totalPages: 0,
        data: [],
      };
    }
    
    const serviceParams: GetArticlesServiceParams = {
      ...params,
      category: englishCategory, // Use translated category
    };

    return await getArticlesService(serviceParams);
  } catch (error) {
    // Log full error details for debugging
    console.error("Error fetching articles by category:", {
      error,
      category: params.category,
      locale: params.locale,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    
    // Return empty serializable response instead of throwing
    // This prevents Next.js 15 serialization errors
    return {
      page: params.page || 1,
      limit: params.limit || 9,
      totalDocs: 0,
      totalPages: 0,
      data: [],
    };
  }
}
