import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewsletterConfirmResult } from "@/app/actions/subscribers/confirmNewsletterSubscription";

interface ConfirmNewsletterUIProps {
  result: NewsletterConfirmResult;
  initialStatus: "success" | "error";
  translations: {
    success: {
      title: string;
      goHomeButton: string;
    };
    error: {
      title: string;
      backToHomeButton: string;
    };
    messages: {
      missingParameters: string;
      confirmationFailed: string;
      unexpectedError: string;
    };
  };
}

export default function ConfirmNewsletterUI({
  result,
  initialStatus,
  translations,
}: ConfirmNewsletterUIProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        {initialStatus === "success" && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {translations.success.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600">{result.message}</p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/">{translations.success.goHomeButton}</Link>
              </Button>
            </div>
          </div>
        )}

        {initialStatus === "error" && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {translations.error.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {result.message || translations.messages.confirmationFailed}
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/">
                  {translations.error.backToHomeButton}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

