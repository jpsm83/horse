"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { translateCategoryToLocale } from "@/lib/utils/routeTranslation";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Trash2,
  FileJson,
  ExternalLink,
  BookOpen,
  Heart,
  MessageCircle,
  Eye,
} from "lucide-react";
import { ISerializedArticle } from "@/types/article";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import DeleteArticleModal from "@/components/DeleteArticleModal";
import ViewJsonModal from "@/components/ViewJsonModal";
import { showToast } from "@/components/Toasts";
import DateCell from "@/components/DateCell";

interface WeeklyStats {
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

interface DashboardProps {
  articles: ISerializedArticle[];
  weeklyStats: WeeklyStats;
  locale: string;
}

export default function Dashboard({
  articles,
  weeklyStats,
  locale,
}: DashboardProps) {
  const t = useTranslations("dashboard");
  const tArticle = useTranslations("article");
  const router = useRouter();
  const currentLocale = useLocale();
  const [articlesList, setArticlesList] = useState<ISerializedArticle[]>(articles);
  const [currentStats, setCurrentStats] = useState<WeeklyStats>(weeklyStats);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [articleToDelete, setArticleToDelete] =
    useState<ISerializedArticle | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [articleToView, setArticleToView] =
    useState<ISerializedArticle | null>(null);

  // Handle successful article deletion
  const handleDeleteSuccess = () => {
    // Remove article from local state and update stats
    if (articleToDelete) {
      setArticlesList((prev) =>
        prev.filter((article) => article._id !== articleToDelete._id)
      );

      // Update stats by decrementing totalArticles
      setCurrentStats((prev) => ({
        ...prev,
        totalArticles: prev.totalArticles - 1,
      }));
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (
    text: string,
    event: React.MouseEvent,
    type: string
  ) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", "Copied!", `${type} copied to clipboard`);
    } catch {
      showToast("error", "Copy Failed", "Failed to copy to clipboard");
    }
  };

  // Open delete modal
  const openDeleteModal = (
    article: ISerializedArticle,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent row click
    setArticleToDelete(article);
    setShowDeleteModal(true);
  };

  // Open JSON modal
  const openJsonModal = (
    article: ISerializedArticle,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent row click
    setArticleToView(article);
    setShowJsonModal(true);
  };

  // Helper functions
  const getArticleTitle = (article: ISerializedArticle) =>
    article.languages[0]?.content.mainTitle || "No title";

  const createSortableHeader = (
    title: string,
    column: {
      toggleSorting: (asc?: boolean) => void;
      getIsSorted: () => false | "asc" | "desc";
    }
  ) => (
    <Button
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-8 px-2 text-xs font-medium"
    >
      {title}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  const StatCard = ({
    icon,
    titleKey,
    value,
  }: {
    icon: React.ReactNode;
    titleKey: string;
    value: number;
  }) => (
    <div className="bg-white shadow-md p-2 flex flex-col items-center justify-center">
      <div className="text-xl mb-1 text-gray-500">{icon}</div>
      <h3 className="text-xs font-semibold text-gray-900 mb-0.5">
        {t(`stats.${titleKey}`)}
      </h3>
      <p className="text-xl font-bold text-red-600">{value}</p>
    </div>
  );

  // Simplified column definitions
  const columns: ColumnDef<ISerializedArticle>[] = [
    {
      accessorKey: "_id",
      header: ({ column }) =>
        createSortableHeader(t("table.columns.id") || "ID", column),
      cell: ({ row }) => {
        const id = String(row.getValue("_id"));
        return (
          <div
            onClick={(e) => copyToClipboard(id, e, "ID")}
            className="text-xs text-gray-600 font-mono cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded transition-colors"
            title="Click to copy ID"
          >
            {id.substring(0, 8)}
          </div>
        );
      },
      enableColumnFilter: true,
    },
    {
      id: "mainTitle",
      accessorFn: (row) => getArticleTitle(row),
      header: ({ column }) =>
        createSortableHeader(t("table.columns.title"), column),
      cell: ({ row }) => {
        const title = getArticleTitle(row.original);
        return (
          <div
            onClick={(e) => copyToClipboard(title, e, "Title")}
            className="overflow-hidden font-medium text-gray-900 text-center whitespace-nowrap w-full cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded transition-colors"
            title="Click to copy title"
          >
            {title}
          </div>
        );
      },
      enableColumnFilter: true,
      filterFn: (row, _, value) =>
        getArticleTitle(row.original)
          .toLowerCase()
          .includes(value.toLowerCase()),
      sortingFn: (rowA, rowB) => {
        const titleA = getArticleTitle(rowA.original);
        const titleB = getArticleTitle(rowB.original);
        return titleA.localeCompare(titleB);
      },
    },
    {
      accessorKey: "likes",
      header: ({ column }) =>
        createSortableHeader(t("table.columns.likes"), column),
      cell: ({ row }) => (
        <div className="text-gray-700 font-medium text-center">
          {(row.getValue("likes") as string[])?.length || 0}
        </div>
      ),
    },
    {
      accessorKey: "commentsCount",
      header: ({ column }) =>
        createSortableHeader(t("table.columns.comments"), column),
      cell: ({ row }) => (
        <div className="text-gray-700 font-medium text-center">
          {row.getValue("commentsCount") || 0}
        </div>
      ),
    },
    {
      accessorKey: "views",
      header: ({ column }) =>
        createSortableHeader(t("table.columns.views"), column),
      cell: ({ row }) => (
        <div className="text-gray-700 font-medium text-center">
          {row.getValue("views") || 0}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) =>
        createSortableHeader(t("table.columns.created"), column),
      cell: ({ row }) => (
        <DateCell
          date={row.getValue("createdAt")}
          locale={currentLocale}
          className="text-xs text-gray-600"
        />
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-xs text-gray-600">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-center gap-1">
          {/* View JSON Button */}
          <button
            onClick={(e) => openJsonModal(row.original, e)}
            className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
            title="View JSON"
          >
            <FileJson className="size-3" />
          </button>

          {/* Go to Article Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row.original);
            }}
            className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
            title="Go to Article"
          >
            <ExternalLink className="size-3" />
          </button>

          {/* Delete Article Button */}
          <button
            onClick={(e) => openDeleteModal(row.original, e)}
            className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
            title={tArticle("actions.delete") || "Delete"}
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 100,
      minSize: 100,
      maxSize: 100,
    },
  ];

  // Helper functions
  const getArticleSlug = (article: ISerializedArticle) =>
    article.languages[0]?.seo?.slug;

  const handleRowClick = (article: ISerializedArticle) => {
    const slug = getArticleSlug(article);
    const category = article.category;

    if (slug && category) {
      // Use canonical URL if available, otherwise construct with translated category
      const canonicalUrl = article.languages[0]?.seo?.canonicalUrl;
      if (canonicalUrl) {
        router.push(new URL(canonicalUrl).pathname);
      } else {
        router.push(`/${locale}/${translateCategoryToLocale(category, locale)}/${slug}`);
      }
    }
  };

  return (
    <div className="space-y-2 m-2 md:m-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
        <StatCard
          icon={<BookOpen />}
          titleKey="totalArticles"
          value={currentStats.totalArticles}
        />
        <StatCard
          icon={<Eye />}
          titleKey="totalViews"
          value={currentStats.totalViews}
        />
        <StatCard
          icon={<Heart />}
          titleKey="totalLikes"
          value={currentStats.totalLikes}
        />
        <StatCard
          icon={<MessageCircle />}
          titleKey="totalComments"
          value={currentStats.totalComments}
        />
      </div>

      {/* Articles Data Table */}
      <div className="bg-white shadow-md p-4">
        <DataTable
          columns={columns}
          data={articlesList}
          onRowClick={handleRowClick}
          getArticleTitle={getArticleTitle}
          locale={currentLocale}
          translations={{
            filterPlaceholder: t("table.filter.placeholder"),
            columns: t("table.filter.columns"),
            rowsPerPage: t("table.pagination.rowsPerPage"),
            selected: t("table.pagination.selected"),
            page: t("table.pagination.page"),
            of: t("table.pagination.of"),
            previous: t("table.pagination.previous"),
            next: t("table.pagination.next"),
            noResults: t("table.noResults"),
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteArticleModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setArticleToDelete(null);
        }}
        article={articleToDelete}
        onSuccess={handleDeleteSuccess}
      />

      {/* View JSON Modal */}
      <ViewJsonModal
        isOpen={showJsonModal}
        onClose={() => {
          setShowJsonModal(false);
          setArticleToView(null);
        }}
        data={articleToView || undefined}
        title={articleToView ? getArticleTitle(articleToView) : "Article JSON"}
      />
    </div>
  );
}

