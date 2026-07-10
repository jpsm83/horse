"use server";

import { IGetArticlesParams, ISerializedArticle } from "@/types/article";
import { IPaginatedResponse } from "@/types/api";
import {
  getArticlesPaginatedService,
  GetArticlesServiceParams,
} from "@/lib/services/articles";
import { FieldProjectionType } from "@/app/api/utils/fieldProjections";

export async function searchArticlesPaginated(
  params: IGetArticlesParams & { query: string; fields?: FieldProjectionType }
): Promise<IPaginatedResponse<ISerializedArticle>> {
  try {
    const serviceParams: GetArticlesServiceParams & { query: string } = {
      ...params,
    };

    return await getArticlesPaginatedService(serviceParams);
  } catch (error) {
    console.error("Error searching articles paginated:", error);
    throw new Error(
      `Failed to search articles: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
