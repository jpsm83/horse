"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ISerializedComment, ISerializedCommentReport } from "@/types/comment";
import { createComment } from "@/app/actions/comment/createComment";
import { deleteComment } from "@/app/actions/comment/deleteComment";
import { toggleCommentLike } from "@/app/actions/comment/toggleCommentLike";
import { reportComment } from "@/app/actions/comment/reportComment";
import { getComments } from "@/app/actions/comment/getComments";
import { Heart, Trash2, User, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/Toasts";
import Image from "next/image";
import { Textarea } from "./ui/textarea";
import DateCell from "./DateCell";

interface CommentsSectionProps {
  articleId: string;
}

export default function CommentsSection({
  articleId,
}: CommentsSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations();
  const [comments, setComments] = useState<ISerializedComment[]>([]);
  const [hasUserCommented, setHasUserCommented] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    commentId: string | null;
  }>({ isOpen: false, commentId: null });
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load comments when component mounts
  useEffect(() => {
    // Create abort controller for this effect
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let isMounted = true;

    const loadComments = async () => {
      if (!articleId || abortController.signal.aborted || !isMounted) return;

      try {
        const result = await getComments({
          articleId,
          page: 1,
          limit: 50,
          sort: "createdAt",
          order: "desc",
        });

        // Check if component is still mounted and not aborted
        if (abortController.signal.aborted || !isMounted) return;

        if (result && result.success && result.comments) {
          setComments(result.comments);
          // Check if current user has commented
          const userHasCommented = result.comments.some((comment) => {
            const commentUserId =
              typeof comment.userId === "object" &&
              comment.userId !== null &&
              "_id" in comment.userId
                ? (comment.userId as { _id: string })._id
                : (comment.userId as string);
            return commentUserId === session?.user?.id;
          });
          setHasUserCommented(userHasCommented);
        } else {
          setComments([]);
        }
      } catch (error) {
        // Only log/update if component is still mounted
        if (abortController.signal.aborted || !isMounted) return;
        console.error("Error loading comments:", error);
        setComments([]);
      }
    };

    loadComments();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
      abortControllerRef.current = null;
    };
  }, [articleId, session?.user?.id]);


  // Handle comment submission
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      router.push("/signin");
      return;
    }
    if (!newComment?.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createComment({
        articleId,
        userId: session?.user?.id || "",
        comment: newComment?.trim() || "",
      });

      if (result.success && result.comment) {
        // Add the new comment to the list
        setComments((prev) => [...prev, result.comment!]);
        setNewComment("");
        // Update hasUserCommented state to hide the input form
        setHasUserCommented(true);
        showToast(
          "success",
          t("comments.toasts.createdSuccess"),
          t("comments.toasts.createdSuccessMessage")
        );
      } else {
        showToast("error", t("comments.toasts.createError"), result.error || t("comments.toasts.createErrorMessage"));
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      showToast("error", t("comments.toasts.createError"), t("comments.toasts.createErrorMessage"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment like
  const handleCommentLike = async (commentId: string) => {
    if (!session?.user?.id) {
      router.push("/signin");
      return;
    }

    try {
      const result = await toggleCommentLike({
        commentId,
        userId: session?.user?.id || "",
      });
      if (result.success) {
        // Update the comment in the local state
        setComments((prev) =>
          prev.map((comment) => {
            if (comment._id?.toString() === commentId) {
              const updatedComment = { ...comment };
              if (result.liked) {
                updatedComment.likes = [
                  ...(comment.likes || []),
                  session?.user?.id || "",
                ];
              } else {
                updatedComment.likes = (
                  comment.likes || []
                ).filter(
                  (id: string) => id !== session?.user?.id
                );
              }
              return updatedComment;
            }
            return comment;
          })
        );
        if (result.liked) {
          showToast(
            "success",
            t("comments.toasts.likedSuccess"),
            t("comments.toasts.likedSuccessMessage")
          );
        } else {
          showToast(
            "success",
            t("comments.toasts.unlikedSuccess"),
            t("comments.toasts.unlikedSuccessMessage")
          );
        }
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
      showToast("error", t("comments.toasts.likeError"), t("comments.toasts.likeErrorMessage"));
    }
  };

  // Handle comment delete
  const handleCommentDelete = async (commentId: string) => {
    if (!session?.user?.id) {
      router.push("/signin");
      return;
    }

    try {
      const result = await deleteComment({
        commentId,
        userId: session?.user?.id || "",
      });
      if (result.success) {
        setComments((prev) =>
          prev.filter((comment) => comment._id?.toString() !== commentId)
        );
        // Show comment form again after deletion
        setHasUserCommented(false);
        showToast(
          "success",
          t("comments.toasts.deletedSuccess"),
          t("comments.toasts.deletedSuccessMessage")
        );
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      showToast("error", t("comments.toasts.deleteError"), t("comments.toasts.deleteErrorMessage"));
    }
  };

  // Handle comment report
  const handleCommentReport = async () => {
    if (!session?.user?.id) {
      router.push("/signin");
      return;
    }

    setIsReporting(true);
    try {
      const result = await reportComment({
        commentId: reportModal?.commentId || "",
        userId: session?.user?.id || "",
        reason: selectedReason,
      });

      if (result.success) {
        // Update the comment in the local state to add the report
        setComments((prev) =>
          prev.map((comment) => {
            if (comment._id?.toString() === reportModal.commentId) {
              const updatedComment = { ...comment };
              const newReport: ISerializedCommentReport = {
                userId: session?.user?.id || "",
                reason: selectedReason as
                  | "bad_language"
                  | "racist"
                  | "spam"
                  | "harassment"
                  | "inappropriate_content"
                  | "false_information"
                  | "other",
                reportedAt: new Date().toISOString(),
              };
              updatedComment.reports = [
                ...(comment.reports || []),
                newReport,
              ];
              return updatedComment;
            }
            return comment;
          })
        );

        // Close modal and reset state
        setReportModal({ isOpen: false, commentId: null });
        setSelectedReason("");
        showToast(
          "success",
          t("comments.toasts.reportedSuccess"),
          t("comments.toasts.reportedSuccessMessage")
        );
      }
    } catch (error) {
      console.error("Error reporting comment:", error);
      showToast("error", t("comments.toasts.reportError"), t("comments.toasts.reportErrorMessage"));
    } finally {
      setIsReporting(false);
    }
  };

  // Open report modal
  const openReportModal = (commentId: string) => {
    if (!session?.user?.id) {
      router.push("/signin");
      return;
    }

    setReportModal({ isOpen: true, commentId });
    setSelectedReason("");
  };

  // Close report modal
  const closeReportModal = () => {
    setReportModal({ isOpen: false, commentId: null });
    setSelectedReason("");
  };

  return (
    <div className="bg-white shadow-lg p-3 sm:p-4 md:p-6 lg:p-8 pb-8 sm:pb-12">
      <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6">
        {t("comments.title")}
      </h3>

      {/* Comment Form - Only for logged in users who haven't commented */}
      {session?.user?.id && !hasUserCommented && (
        <form onSubmit={handleComment} className="mb-4 sm:mb-6 md:mb-8">
          <div className="space-y-3">
            <Textarea
              value={newComment || ""}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("comments.form.placeholder")}
              className="input-standard w-full text-sm border-1 rounded-lg resize-none"
              maxLength={1000}
              disabled={isSubmitting}
            />

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-xs text-gray-500">
                {newComment?.length || 0}{t("comments.form.charCount")}
              </span>
              <Button
                type="submit"
                disabled={!newComment?.trim() || isSubmitting}
                className="w-auto"
              >
                {isSubmitting ? t("comments.form.submitting") : t("comments.form.submit")}
              </Button>
            </div>
          </div>
        </form>
      )}
      {/* Comments List */}
      <div className="space-y-3 sm:space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4 sm:py-6 md:py-8 text-sm">
            {t("comments.form.noComments")}
          </p>
        ) : (
          comments
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .map((comment, index) => {
            const isLiked = comment.likes?.some(
              (like: string) => like === session?.user?.id
            );
            const likeCount = comment.likes?.length || 0;
            
            // Get comment author info - handle both populated and non-populated userId
            const commentAuthor = typeof comment.userId === 'object' && comment.userId !== null && 'username' in comment.userId 
              ? comment.userId as { username: string; imageUrl?: string; _id: string }
              : null;
            const commentAuthorId = typeof comment.userId === 'object' && comment.userId !== null && '_id' in comment.userId
              ? (comment.userId as { _id: string })._id
              : comment.userId as string;
            const commentAuthorName = commentAuthor?.username || 'Unknown User';
            const commentAuthorImage = commentAuthor?.imageUrl;
            
            const canDelete =
              session?.user?.id &&
              (commentAuthorId === session?.user?.id ||
                session?.user?.role === "admin");
            const isReported =
              comment.reports && comment.reports.length >= 3;
            const hasUserReported = comment.reports?.some(
              (report: ISerializedCommentReport) =>
                report.userId === session?.user?.id
            );

            return (
              <div
                key={comment._id?.toString() || index}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 relative"
              >
                <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {commentAuthorImage &&
                      commentAuthorImage.trim() !== "" ? (
                        <Image
                          src={commentAuthorImage}
                          alt={commentAuthorName}
                          width={32}
                          height={32}
                          priority
                          className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
                        />
                      ) : (
                        <User size={16} className="sm:w-5 sm:h-5" />
                      )}
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2 gap-2">

                      <div className="cursor-default flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-gray-800 text-sm">
                          {commentAuthorName}
                        </span>
                        <DateCell
                          date={comment.createdAt}
                          locale="en-US"
                          className="text-xs text-gray-500"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {/* Like Button */}
                        {!isReported && (
                          <Button
                            onClick={() =>
                              handleCommentLike(comment._id?.toString() || "")
                            }
                            className={`cursor-pointer bg-transparent border-none hover:bg-transparent transition-all duration-200 shadow-none ${
                              isLiked ? "text-red-600" : "text-gray-600"
                            }`}
                            title={isLiked ? t("comments.actions.unlikeComment") : t("comments.actions.likeComment")}
                          >
                            <Heart
                              size={12}
                              className={
                                isLiked
                                  ? "fill-current"
                                  : "stroke-current fill-none"
                              }
                            />
                            {likeCount > 0 && (
                              <span className="text-xs font-medium">
                                {likeCount}
                              </span>
                            )}
                          </Button>
                        )}

                        {/* Report Button - Only for other users' comments that haven't been reported by current user */}
                        {session?.user?.id &&
                          commentAuthorId !== session?.user?.id &&
                          !isReported &&
                          !hasUserReported && (
                            <Button
                              onClick={() =>
                                openReportModal(comment._id?.toString() || "")
                              }
                              className="cursor-pointer text-gray-600 bg-transparent hover:bg-transparent transition-all duration-200 border-none shadow-none"
                              title={t("comments.actions.reportComment")}
                            >
                              <Flag />
                            </Button>
                          )}
                        {/* Delete Button */}
                        {canDelete && (
                          <Button
                            onClick={() =>
                              handleCommentDelete(comment._id?.toString() || "")
                            }
                            className="cursor-pointer text-red-600 bg-transparent hover:bg-transparent hover:text-red-500 transition-all duration-200 border-none shadow-none"
                            title={t("comments.actions.deleteComment")}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Reported Overlay */}
                    {isReported ? (
                      <div className="flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🚫</div>
                          <p className="text-sm font-medium text-gray-700">
                            {t("comments.moderation.reported")}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {t("comments.moderation.flagged")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm leading-relaxed break-words">
                        {comment.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Report Modal */}
      {reportModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("comments.reportModal.title")}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t("comments.reportModal.description")}
            </p>

            <div className="space-y-3 mb-6">
              {[
                { value: "bad_language", label: t("comments.reportModal.reasons.badLanguage") },
                { value: "racist", label: t("comments.reportModal.reasons.racistContent") },
                { value: "spam", label: t("comments.reportModal.reasons.spam") },
                { value: "harassment", label: t("comments.reportModal.reasons.harassment") },
                {
                  value: "inappropriate_content",
                  label: t("comments.reportModal.reasons.inappropriateContent"),
                },
                { value: "false_information", label: t("comments.reportModal.reasons.falseInformation") },
                { value: "other", label: t("comments.reportModal.reasons.other") },
              ].map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center space-x-3 ${
                    isReporting
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    disabled={isReporting}
                    className="w-4 h-4 text-orange-600 focus:ring-purple-400 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700">{reason.label}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={closeReportModal}
                disabled={isReporting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {t("comments.reportModal.cancel")}
              </Button>
              <Button
                onClick={handleCommentReport}
                disabled={!selectedReason || isReporting}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isReporting ? (
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
                    {t("comments.reportModal.submitting")}
                  </>
                ) : (
                  t("comments.reportModal.submit")
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
