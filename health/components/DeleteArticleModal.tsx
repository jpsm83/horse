"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteArticle } from "@/app/actions/article/deleteArticle";
import { showToast } from "@/components/Toasts";
import { ISerializedArticle } from "@/types/article";

interface DeleteArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: ISerializedArticle | null;
  onSuccess?: () => void;
}

export default function DeleteArticleModal({
  isOpen,
  onClose,
  article,
  onSuccess,
}: DeleteArticleModalProps) {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const t = useTranslations("article");

  // Helper function to get article title
  const getArticleTitle = (article: ISerializedArticle | null) => 
    article?.languages[0]?.content.mainTitle || "Unknown Article";

  // Handle article deletion
  const handleDeleteArticle = async () => {
    if (!article?._id) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteArticle(
        article._id.toString()
      );

      if (result.success) {
        showToast(
          "success",
          t("deleteModal.success"),
          result.message || t("deleteModal.success")
        );
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showToast(
          "error",
          t("deleteModal.error"),
          result.message || t("deleteModal.error")
        );
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      showToast(
        "error",
        t("deleteModal.error"),
        t("deleteModal.error")
      );
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  if (!isOpen || !article) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("deleteModal.title")}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {t("deleteModal.description")}
        </p>
        <p className="text-sm font-medium text-gray-800 mb-6">
          <strong>{t("deleteModal.articleTitle")}:</strong> {getArticleTitle(article)}
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleDeleteArticle}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t("deleteModal.deleting")}
              </>
            ) : (
              t("deleteModal.confirm")
            )}
          </Button>
          <Button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("deleteModal.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
