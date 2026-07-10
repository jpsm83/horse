import { IArticle, IArticleCardProps } from "@/types/article";

/**
 * Convert IArticle[] to IArticleCardProps[] for display components
 */
export const transformArticlesToCardProps = (articles: IArticle[]): IArticleCardProps[] => {
  return articles.map((article: IArticle) => {
    const language = article.languages[0]; // Get first (and only) language
    
    return {
      id: article._id?.toString() || '',
      title: language.content.mainTitle || '',
      excerpt: language.seo?.metaDescription || '',
      category: article.category,
      author: typeof article.createdBy === 'object' && article.createdBy && 'username' in article.createdBy
        ? (article.createdBy as { username: string }).username
        : 'Women\'s Spot Team',
      publishedAt: article.createdAt ? new Date(article.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      readTime: '5 min read', // Default read time
      imageUrl: article.articleImages && article.articleImages.length > 0 ? article.articleImages[0] : '/womens-spot.png',
      slug: language.seo?.slug || '',
    };
  });
};
