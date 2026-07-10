"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { mainCategories } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";

interface CreateArticleFormProps {
  locale: string;
}

interface ArticleLanguage {
  locale: string;
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
}

interface ImageContext {
  alt: string;
  caption: string;
}

interface ApiResponse {
  message?: string;
  article?: unknown;
}

export default function CreateArticleForm({ locale }: CreateArticleFormProps) {
  const t = useTranslations("createArticle");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      setError(
        t("form.validation.imageType") ||
          "Please select only image files (JPEG, PNG, or WebP)"
      );
      return;
    }

    // Validate file sizes (max 5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setError(
        t("form.validation.imageSize") ||
          "Image files must be less than 5MB each"
      );
      return;
    }

    setSelectedImages(files);
    setError(null);

    // Create previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke object URLs to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);

    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData(e.currentTarget);

      // Basic validation
      const title = formData.get("title") as string;
      const content = formData.get("content") as string;
      const category = formData.get("category") as string;

      if (!title || !content || !category) {
        setError(
          t("form.validation.required") || "Please fill in all required fields"
        );
        setIsSubmitting(false);
        return;
      }

      // Create article structure for current locale
      const languages: ArticleLanguage[] = [
        {
          locale: locale,
          title: title.trim(),
          content: content.trim(),
          metaTitle: title.trim(),
          metaDescription: content.trim().substring(0, 160),
          slug: title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        },
      ];

      // Create imagesContext based on uploaded images or default
      const imagesContext: ImageContext[] =
        selectedImages.length > 0
          ? selectedImages.map((_, index) => ({
              alt: `${title.trim()} - Image ${index + 1}`,
              caption: `${title.trim()} - Image ${index + 1}`,
            }))
          : [
              {
                alt: title.trim(),
                caption: title.trim(),
              },
            ];

      const formDataToSend = new FormData();
      formDataToSend.append("category", category);
      formDataToSend.append("languages", JSON.stringify(languages));
      formDataToSend.append("imagesContext", JSON.stringify(imagesContext));

      // Append image files
      selectedImages.forEach((file) => {
        formDataToSend.append("articleImageFiles", file);
      });

      const tags = formData.get("tags") as string;
      if (tags) {
        formDataToSend.append("tags", tags);
      }

      const response = await fetch("/api/v1/articles", {
        method: "POST",
        body: formDataToSend,
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        setError(
          result.message ||
            t("form.error.submit") ||
            "Failed to create article. Please try again."
        );
        setIsSubmitting(false);
        return;
      }

      setSuccess(
        t("form.success") || "Article created successfully! Redirecting..."
      );
      // Redirect to article or dashboard after a short delay
      setTimeout(() => {
        router.push(`/${locale}/articles`);
      }, 2000);
    } catch {
      setError(
        t("form.error.network") ||
          "Network error. Please check your connection and try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Article Creation Form */}
      <div className="bg-white rounded-lg shadow-md p-6 relative">
        {/* Loading Overlay */}
        {isSubmitting && <Spinner size="lg" overlay text={t("form.submitting") || "Creating article..."} />}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("form.title")}
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="input-standard w-full focus:ring-blue-500 focus:border-transparent"
              placeholder={t("form.title")}
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("form.content")}
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              required
              className="input-standard w-full focus:ring-blue-500 focus:border-transparent"
              placeholder={t("form.content")}
            />
            <p className="mt-1 text-sm text-gray-500">
              {t("form.contentHint") ||
                "Write the main content of your article"}
            </p>
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("form.category")}
            </label>
            <select
              id="category"
              name="category"
              required
              className="input-standard w-full focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("form.selectCategory")}</option>
              {mainCategories.map((category) => (
                <option key={category} value={category}>
                  {t(`form.categories.${category}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("form.tags")}
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="input-standard w-full focus:ring-blue-500 focus:border-transparent"
              placeholder={t("form.tagsPlaceholder")}
            />
            <p className="mt-1 text-sm text-gray-500">
              {t("form.tagsHint") || "Separate tags with commas"}
            </p>
          </div>

          <div>
            <label
              htmlFor="images"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("form.images") || "Article Images"}
            </label>
            <input
              type="file"
              id="images"
              name="images"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className="input-standard w-full focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              {t("form.imagesHint") ||
                "Upload images (JPEG, PNG, or WebP). Max 5MB per file. Optional."}
            </p>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative w-full h-32">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover rounded-md border border-gray-300"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-auto flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span>{t("form.submitting") || "Creating..."}</span>
                </>
              ) : (
                t("form.submit")
              )}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              className="w-auto"
            >
              {t("form.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
