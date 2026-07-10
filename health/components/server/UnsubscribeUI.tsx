import { CheckCircle, XCircle, Mail } from "lucide-react";
import { NewsletterUnsubscribeResult } from "@/app/actions/subscribers/newsletterUnsubscribe";

interface UnsubscribeUIProps {
  result?: NewsletterUnsubscribeResult;
  hasEmail: boolean;
  initialStatus: "success" | "error" | "no-email";
  translations: {
    title: string;
    description: string;
    successTitle: string;
    successMessage: string;
    errorTitle: string;
    errorMessage: string;
    invalidLinkTitle: string;
    invalidLinkMessage: string;
  };
}

export default function UnsubscribeUI({
  result,
  hasEmail,
  initialStatus,
  translations,
}: UnsubscribeUIProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        {/* If no email parameter, show invalid link error */}
        {!hasEmail ? (
          <>
            <div className="text-center mb-6">
              <Mail className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {translations.title}
              </h1>
              <p className="text-gray-600">{translations.description}</p>
            </div>

            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {translations.invalidLinkTitle}
              </h2>
              <p className="text-gray-600 mb-6">
                {translations.invalidLinkMessage}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <Mail className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {translations.title}
              </h1>
              <p className="text-gray-600">{translations.description}</p>
            </div>

            {initialStatus === "success" ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {translations.successTitle}
                </h2>
                <p className="text-gray-600 mb-6">
                  {translations.successMessage}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {translations.errorTitle}
                </h2>
                <p className="text-gray-600 mb-6">
                  {result?.message || translations.errorMessage}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

