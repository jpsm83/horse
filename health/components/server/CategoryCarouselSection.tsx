import { getArticlesByCategory } from "@/app/actions/article/getArticlesByCategory";
import CategoryCarousel from "@/components/CategoryCarousel";

interface CategoryCarouselSectionProps {
  category: string;
  locale: string;
}

export default async function CategoryCarouselSection({
  category,
  locale,
}: CategoryCarouselSectionProps) {
  const response = await getArticlesByCategory({
    category,
    locale,
    limit: 10,
    skipCount: true,
    fields: "featured",
  });

  return (
    <CategoryCarousel
      category={category}
      initialArticles={response.data}
    />
  );
}

