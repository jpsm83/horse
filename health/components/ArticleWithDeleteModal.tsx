"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ISerializedArticle } from "@/types/article";
import Article from "./Article";
import DeleteArticleModal from "@/components/DeleteArticleModal";

interface ArticleWithDeleteModalProps {
  articleData: ISerializedArticle | undefined;
}

export default function ArticleWithDeleteModal({
  articleData,
}: ArticleWithDeleteModalProps) {
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const router = useRouter();

  // Handle successful article deletion
  const handleDeleteSuccess = () => {
    // Redirect to home page after successful deletion
    router.push("/");
  };

  return (
    <>
      <Article
        articleData={articleData}
        onDeleteClick={() => setShowDeleteModal(true)}
      />
      <DeleteArticleModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        article={articleData || null}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}

