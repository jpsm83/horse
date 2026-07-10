"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { showToast } from "@/components/Toasts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";

interface FormData {
  email: string;
  password: string;
}

interface SignInProps {
  locale: string;
}

export default function SignIn({ locale }: SignInProps) {
  const router = useRouter();
  const t = useTranslations("SignIn");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<FormData>({ mode: "onChange" });

  // Submit login with credentials
  const onSubmit = async (credentials: FormData) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false, // Prevent automatic redirect to handle errors
      });

      // NextAuth v5 returns a result object with error property for failures
      if (result && result.error) {
        // Handle authentication errors
        if (result.error === "CredentialsSignin") {
          // This is expected behavior for invalid credentials, not a real error
          showToast("error", t("authenticationFailed"), t("checkCredentials"));
        } else {
          // This is a real error that should be logged
          console.error("Sign-in error:", result.error);
          showToast("error", t("authenticationFailed"), t("checkCredentials"));
        }
        return; // Loading will be reset in finally block
      }

      // If we get here, authentication was successful
      showToast("success", t("signInSuccessful") || "Sign in successful", t("redirecting") || "Redirecting...");
      
      // Reset loading before redirect (good practice, even though page will reload)
      setIsLoading(false);
      
      // Redirect based on user role (will be handled by server-side check on next page load)
      // Use router.refresh() to reload and let server-side redirect handle it
      router.refresh();
    } catch (err) {
      // This should rarely happen with NextAuth, but handle it gracefully
      console.error("Unexpected sign-in error:", err);
      showToast("error", t("authenticationFailed"), t("checkCredentials"));
    } finally {
      // Always reset loading state (safety net for any edge cases)
      setIsLoading(false);
    }
  };

  // Handle Google signin
  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const result = await signIn("google", { callbackUrl: "/" });

      if ((result as unknown as { error?: string })?.error) {
        console.error(
          "Google sign-in error:",
          (result as unknown as { error?: string })?.error
        );
        showToast("error", t("googleSignInFailed"), t("tryAgainOrUseEmail"));
        return; // Loading will be reset in finally block
      }
      
      // Success: Google sign-in redirects externally, but reset loading for safety
      setIsLoading(false);
    } catch (err) {
      console.error("Google sign-in error:", err);
      showToast("error", t("googleSignInFailed"), t("tryAgainOrUseEmail"));
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldName: keyof FormData) => {
    if (errors[fieldName]) clearErrors(fieldName);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Loading Overlay */}
      {isLoading && <Spinner size="xl" fullScreen text={t("signingIn") || "Signing in..."} />}

      <div className="bg-white py-8 px-4 shadow sm:px-10 space-y-6">
        <p className="text-center text-sm text-gray-600 mb-6">
          {t("dontHaveAccount")}{" "}
          <Link href={`/${locale}/signup`} className="main-link">
            {t("signUp")}
          </Link>
        </p>

        {/* Google Sign In Button */}
        <Button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-600 bg-gray-50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-2 focus:border-purple-400"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? t("signingInWithGoogle") : t("signInWithGoogle")}
        </Button>

        {/* Divider */}
        <div className="flex items-center">
          <span className="w-full border-t border-gray-300" />
          <span className="bg-white text-gray-500 px-2">{t("or")}</span>
          <span className="w-full border-t border-gray-300" />
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("emailAddress")}
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address",
                  },
                })}
                onChange={(e) => {
                  setValue("email", e.target.value);
                  handleInputChange("email");
                }}
                className={errors.email ? "input-error" : "input-standard"}
                placeholder={t("enterEmail")}
              />
              {errors.email && (
                <p className="input-error">{errors.email.message}</p>
              )}
            </div>

            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("password")}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="password"
                disabled={isLoading}
                {...register("password", {
                  required: "Password is required",
                })}
                onChange={(e) => {
                  setValue("password", e.target.value);
                  handleInputChange("password");
                }}
                className={errors.password ? "input-error" : "input-standard"}
                placeholder={t("enterPassword")}
              />
              <Button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="input-error">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="text-white" />
                <span>{t("signIn")}</span>
              </>
            ) : (
              t("signIn")
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between gap-2 w-full">
          <Link
            href={`/${locale}`}
            className={`text-sm text-gray-500 hover:text-red-500 ${
              isLoading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {t("backToHome")}
          </Link>

          <Link
            href={`/${locale}/forgot-password`}
            className={`text-sm text-gray-500 hover:text-red-500 ${
              isLoading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {t("forgotPassword")}
          </Link>
        </div>
      </div>
    </div>
  );
}
