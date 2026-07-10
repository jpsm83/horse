"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import {
  User,
  BookOpen,
  Lock,
  CheckCircle,
  XCircle,
  Trash2,
  Camera,
  ChevronsUpDown,
} from "lucide-react";
import Spinner from "@/components/ui/spinner";
import { mainCategories, newsletterFrequencies } from "@/lib/constants";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { updateUserProfile } from "@/app/actions/user/updateUserProfile";
import { updateSubscriberPreferences } from "@/app/actions/subscribers/updateSubscriberPreferences";
import requestEmailConfirmation from "@/app/actions/auth/requestEmailConfirmation";
import { ISerializedUser } from "@/types/user";
import { useRouter, usePathname } from "next/navigation";
import requestPasswordResetAction from "@/app/actions/auth/requestPasswordReset";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import { showToast } from "@/components/Toasts";
import { translateRouteToLocale, translateRouteToEnglish } from "@/lib/utils/routeTranslation";

// Import country flag components
import { US, BR, ES, FR, DE, IT } from "country-flag-icons/react/1x1";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface FormData {
  username: string;
  email: string;
  role: string;
  birthDate: string;
  preferences: {
    language: string;
    region: string;
  };
  subscriptionPreferences: {
    categories: string[];
    subscriptionFrequencies: string;
  };
  imageFile?: File;
}

interface ProfileProps {
  locale: string;
  initialUser: ISerializedUser;
}

export default function Profile({ locale, initialUser }: ProfileProps) {
  const t = useTranslations("profile");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isRequestingEmailConfirmation, setIsRequestingEmailConfirmation] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalValues, setOriginalValues] = useState<FormData | null>(null);
  const isInitialized = useRef(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Use initial user data from server
  const [user, setUser] = useState<ISerializedUser>(initialUser);

  // Handle language change - immediate language switch like Navbar
  const handleLanguageChange = (newLanguage: string) => {
    // Map language codes to region codes
    const languageToRegion: Record<string, string> = {
      en: "US",
      pt: "BR",
      es: "ES",
      fr: "FR",
      de: "DE",
      it: "IT",
    };

    const newRegion = languageToRegion[newLanguage] || "US";

    // Update form fields to track the new language
    setValue("preferences.language", newLanguage);
    setValue("preferences.region", newRegion);

    // Get current path without language prefix
    // Only match actual locale codes, not any two letters (fixes /ptofile bug)
    const validLocales = ['en', 'pt', 'es', 'fr', 'de', 'it'];
    const localePattern = `^\\/(${validLocales.join('|')})(-[A-Z]{2})?`;
    const pathWithoutLang = pathname?.replace(new RegExp(localePattern), "") || "";
    
    // Translate route names (e.g., "profile" -> "perfil" for Portuguese)
    const pathSegments = pathWithoutLang.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0];
      const englishRoute = translateRouteToEnglish(firstSegment);
      const translatedRoute = translateRouteToLocale(englishRoute, newLanguage);
      pathSegments[0] = translatedRoute;
    }
    
    const translatedPath = pathSegments.length > 0 ? `/${pathSegments.join('/')}` : "";
    const newPath = `/${newLanguage}${translatedPath}`;

    // Use replace to avoid adding to browser history and ensure proper refresh
    router.replace(newPath);
  };

  // Get language display name
  const getLanguageDisplayName = (lang: string): string => {
    const displayNames: Record<string, string> = {
      en: "English",
      pt: "Português",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      it: "Italiano",
    };

    return displayNames[lang] || lang;
  };

  // Get country flag component
  const getCountryFlag = (lang: string, size: string) => {
    const flagMap: Record<
      string,
      React.ComponentType<{ title?: string; className?: string }>
    > = {
      en: US,
      pt: BR,
      es: ES,
      fr: FR,
      de: DE,
      it: IT,
    };

    const FlagComponent = flagMap[lang];
    const languageName = getLanguageDisplayName(lang);

    if (size === "sm") {
      return (
        <FlagComponent
          title={languageName}
          className="!w-4 !h-4 rounded-full"
        />
      );
    }

    if (size === "md") {
      return (
        <FlagComponent
          title={languageName}
          className="!w-8 !h-8 rounded-full"
        />
      );
    }

    if (size === "lg") {
      return (
        <FlagComponent
          title={languageName}
          className="!w-12 !h-12 rounded-full"
        />
      );
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
    watch,
    trigger,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      username: "",
      email: "",
      role: "",
      birthDate: "",
      preferences: {
        language: "en",
        region: "US",
      },
      subscriptionPreferences: {
        categories: [],
        subscriptionFrequencies: "weekly",
      },
    },
  });

  const watchedValues = watch();

  // Validate subscription frequency when it changes
  useEffect(() => {
    const frequency =
      watchedValues.subscriptionPreferences?.subscriptionFrequencies;
    if (!frequency) {
      setValue("subscriptionPreferences.subscriptionFrequencies", "weekly", {
        shouldValidate: true,
      });
    }
  }, [
    watchedValues.subscriptionPreferences?.subscriptionFrequencies,
    setValue,
  ]);

  // Load user data and set form values when user data changes
  useEffect(() => {
    if (session?.user && user && !isInitialized.current) {
      isInitialized.current = true;

      const initialValues: FormData = {
        username: user.username || "",
        email: user.email || "",
        role: user.role || "",
        birthDate: user.birthDate
          ? new Date(user.birthDate).toISOString().split("T")[0]
          : "",
        preferences: {
          language: user.preferences?.language || locale || "en",
          region: user.preferences?.region || "US",
        },
        subscriptionPreferences: {
          categories: user.subscriptionPreferences?.categories || [],
          subscriptionFrequencies:
            user.subscriptionPreferences?.subscriptionFrequencies || "weekly",
        },
        // Don't include password fields in initial values
      };

      setOriginalValues(initialValues);

      // Set form values
      Object.entries(initialValues).forEach(([key, value]) => {
        if (key !== "imageFile") {
          if (key === "preferences") {
            // For preferences, use current locale instead of database value
            setValue("preferences", {
              language: locale || "en",
              region: (value as { language: string; region: string }).region,
            });
          } else {
            setValue(key as keyof FormData, value);
          }
        }
      });
    }
  }, [user, setValue, session?.user, locale]);

  // Update user state when initialUser prop changes
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  // Reset form when user data changes (for cases where user data is updated externally)
  useEffect(() => {
    if (user && isInitialized.current) {
      const updatedValues: FormData = {
        username: user.username || "",
        email: user.email || "",
        role: user.role || "",
        birthDate: user.birthDate
          ? new Date(user.birthDate).toISOString().split("T")[0]
          : "",
        preferences: {
          language: user.preferences?.language || locale || "en",
          region: user.preferences?.region || "US",
        },
        subscriptionPreferences: {
          categories: user.subscriptionPreferences?.categories || [],
          subscriptionFrequencies:
            user.subscriptionPreferences?.subscriptionFrequencies || "weekly",
        },
      };

      setOriginalValues(updatedValues);

      // Update form values
      Object.entries(updatedValues).forEach(([key, value]) => {
        if (key !== "imageFile") {
          if (key === "preferences") {
            // For preferences, use current locale instead of database value
            setValue("preferences", {
              language: locale || "en",
              region: (value as { language: string; region: string }).region,
            });
          } else {
            setValue(key as keyof FormData, value);
          }
        }
      });
    }
  }, [user, setValue, locale]);

  // Check for changes - use useMemo to prevent infinite loops
  const hasChanges = useMemo(() => {
    if (!originalValues) return false;

    const currentValues = {
      username: watchedValues.username,
      email: watchedValues.email,
      role: watchedValues.role,
      birthDate: watchedValues.birthDate,
      preferences: {
        language: watchedValues.preferences?.language || locale, // Use form value, fallback to locale
        region: watchedValues.preferences?.region,
      },
      subscriptionPreferences: watchedValues.subscriptionPreferences,
    };

    // Check if current locale differs from original database language
    const languageChanged = locale !== originalValues.preferences.language;

    return (
      JSON.stringify(currentValues) !== JSON.stringify(originalValues) ||
      selectedImage !== null ||
      languageChanged
    );
  }, [watchedValues, originalValues, selectedImage, locale]);

  // Handle password reset
  const handleResetPassword = async () => {
    if (!user?.email) {
      showToast("error", t("validation.userEmailNotFound"), "");
      return;
    }

    setIsResettingPassword(true);

    try {
      const result = await requestPasswordResetAction(user.email);

      if (result.success) {
        showToast("success", t("passwordResetSent"), result.message || "");
      } else {
        showToast("error", t("passwordResetFailed"), result.message || "");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      showToast("error", t("unexpectedError"), "");
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle email confirmation request
  const handleRequestEmailConfirmation = async () => {
    if (!user?.email) {
      showToast("error", t("validation.userEmailNotFound"), "");
      return;
    }

    setIsRequestingEmailConfirmation(true);

    try {
      // Use server action instead of fetch
      const result = await requestEmailConfirmation(user.email);

      if (result.success) {
        showToast(
          "success",
          t("messages.successSendingEmailConfirmation"),
          result.message || "Email confirmation sent successfully!"
        );
      } else {
        showToast(
          "error",
          t("messages.unexpectedErrorSendingEmailConfirmation"),
          result.message || "Failed to send email confirmation"
        );
      }
    } catch (error) {
      console.error("Email confirmation request error:", error);
      showToast(
        "error",
        t("messages.unexpectedErrorSendingEmailConfirmation"),
        "Failed to request email confirmation"
      );
    } finally {
      setIsRequestingEmailConfirmation(false);
    }
  };

  // Handle image selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("error", t("validation.invalidImageType"), "");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", t("validation.imageTooLarge"), "");
        return;
      }

      setSelectedImage(file);
      setValue("imageFile", file); // Update form value

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setValue("imageFile", undefined);
  };

  const onSubmit = async (data: FormData) => {
    if (!session?.user?.id || !session?.user?.email) {
      showToast("error", "User not authenticated", "");
      return;
    }

    if (!data.subscriptionPreferences?.subscriptionFrequencies) {
      showToast("error", t("validation.newsletterFrequencyRequired"), "");
      return;
    }

    setIsSavingProfile(true);

    try {
      const updateData = {
        username: data.username.trim(),
        email: data.email,
        role: data.role,
        birthDate: data.birthDate,
        preferences: {
          language: data.preferences.language,
          region: data.preferences.region,
        },
        subscriptionPreferences: {
          categories: data.subscriptionPreferences.categories,
          subscriptionFrequencies: data.subscriptionPreferences.subscriptionFrequencies,
        },
        subscriptionId: user?.subscriptionId,
        imageFile: selectedImage || undefined,
      };

      const result = await updateUserProfile(session.user.id, updateData);

      if (!result?.success) {
        showToast("error", t("updateFailed"), result?.message || "Unknown error occurred");
        return;
      }

      // Update local user state with the updated data
      const updatedUser = result.data;
      if (updatedUser) {
        setUser(updatedUser);
      }

      // Update subscription preferences if subscriptionId exists
      if (updatedUser?.subscriptionId && updateData.subscriptionPreferences) {
        try {
          const subResult = await updateSubscriberPreferences(
            updatedUser.subscriptionId,
            { subscriptionPreferences: updateData.subscriptionPreferences }
          );

          if (subResult.success && subResult.data?.subscriptionPreferences) {
            setUser(prev => ({
              ...prev,
              subscriptionPreferences: subResult.data!.subscriptionPreferences
            }));
          }
        } catch (error) {
          // Log error but don't fail the whole update
          console.error("[Profile] Subscription preferences update error:", error);
        }
      }

      // Reset form state after successful save
      setOriginalValues(data);
      setSelectedImage(null);
      setImagePreview(null);
      showToast("success", t("updateSuccess"), "");
    } catch (error) {
      console.error("[Profile] Profile update error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      showToast("error", t("updateFailed"), errorMessage);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleInputChange = (fieldName: keyof FormData) => {
    // Clear field error when user starts typing
    if (errors[fieldName]) {
      clearErrors(fieldName);
    }
  };

  // Determine loading state
  const isLoading = isSavingProfile || isResettingPassword || isRequestingEmailConfirmation;

  return (
    <div className="flex items-start justify-center px-4 md:px-8 relative">
      {/* Loading Overlay */}
      {isLoading && <Spinner size="xl" fullScreen />}

      <div className="max-w-6xl w-full space-y-6 md:space-y-8 md:bg-white p-4 md:p-8 md:rounded-lg md:shadow-lg">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Profile Image Section - Centered on mobile, left on desktop */}
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Profile Preview"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : user?.imageUrl ? (
                <Image
                  width={128}
                  height={128}
                  priority
                  src={user?.imageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                  <User className="w-12 h-12 md:w-16 md:h-16 text-gray-500" />
                </div>
              )}
            </div>

            {/* Image Upload Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-all duration-300 rounded-full text-white opacity-0 hover:opacity-100">
              <Input
                type="file"
                id="image"
                accept="image/*"
                disabled={isLoading}
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="image"
                className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
              >
                <Camera size={36} />
                <span className="text-xs">{t("actions.changeImage")}</span>
              </label>
            </div>

            {/* Remove Image Button - Only show when there's a preview */}
            {imagePreview && (
              <Button
                type="button"
                onClick={removeImage}
                className="absolute bottom-0 left-0 bg-red-600 hover:bg-red-500 text-white rounded-full border-1 border-white h-8 w-8"
                title={t("actions.removeImage")}
              >
                <Trash2 />
              </Button>
            )}
          </div>

          {/* Header Info */}
          <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1 cursor-default">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  {user?.username}
                </h1>
                <h3 className="text-sm md:text-md text-gray-400 mt-1">
                  {user?.email}
                </h3>
                <p className="text-sm md:text-lg text-gray-600 mt-2">
                  {t("subtitle")}
                </p>
              </div>

              {/* Language Selector */}
              <div className="relative flex items-center space-x-2">
                <h2 className="text-sm md:text-md text-gray-500">
                  {t("language.preferences")}
                </h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="cursor-pointer"
                    >
                      {getCountryFlag(locale, "md")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[140px] bg-white shadow-lg"
                    align="end"
                    side="bottom"
                    sideOffset={4}
                  >
                    {routing.locales.map((lang) => (
                      <DropdownMenuItem
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className="cursor-pointer hover:bg-red-60"
                      >
                        <div className="flex items-center space-x-2">
                          {getCountryFlag(lang, "sm")}
                          <span>{getLanguageDisplayName(lang)}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4 cursor-default">
              <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                {user?.emailVerified ? (
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs md:text-sm font-medium text-gray-900 truncate">
                    {user?.emailVerified
                      ? t("stats.verified")
                      : t("stats.unverified")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t("stats.emailStatus")}
                  </div>
                </div>
              </div>
              <div className="text-center p-2 md:p-3 bg-gray-50 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-red-600">
                  {user?.likedArticles?.length || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-500">
                  {t("stats.likedArticles")}
                </div>
              </div>
              <div className="text-center p-2 md:p-3 bg-gray-50 rounded-lg sm:col-span-2 md:col-span-1">
                <div className="text-xl md:text-2xl font-bold text-red-600">
                  {user?.commentedArticles?.length || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-500">
                  {t("stats.comments")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Confirmation Request */}
        {!user?.emailVerified && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              type="button"
              onClick={handleRequestEmailConfirmation}
              disabled={isLoading}
              className="customDefault"
            >
              <CheckCircle className="w-4 h-4 mr-2 text-white" />
              {t("emailConfirmation.requestButton")}
            </Button>
            <p className="text-sm text-white">
              {t("emailConfirmation.description")}
            </p>
          </div>
        )}

        <form
          className="space-y-6 md:space-y-8"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-6 md:space-y-8">
            {/* Personal Information Section */}
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
                <User className="w-4 h-4 md:w-5 md:h-5 mr-2 text-red-600" />
                {t("sections.personal")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("fields.username")}
                  </label>
                  <Input
                    id="username"
                    type="text"
                    disabled={isLoading}
                    {...register("username", {
                      required: t("validation.usernameRequired"),
                      minLength: {
                        value: 5,
                        message: t("validation.usernameTooShort"),
                      },
                      maxLength: {
                        value: 30,
                        message: t("validation.usernameTooLong"),
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_\-\s]+$/,
                        message: t("validation.usernameInvalidChars"),
                      },
                    })}
                    onChange={(e) => {
                      setValue("username", e.target.value);
                      handleInputChange("username");
                    }}
                    className={
                      errors.username ? "input-error" : "input-standard"
                    }
                    placeholder={t("fields.enterUsername")}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="birthDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("fields.birthDate")}
                  </label>
                  <Input
                    id="birthDate"
                    type="date"
                    disabled={isLoading}
                    {...register("birthDate", {
                      required: t("validation.birthDateRequired"),
                    })}
                    onChange={(e) => {
                      setValue("birthDate", e.target.value);
                      handleInputChange("birthDate");
                    }}
                    className={
                      errors.birthDate ? "input-error" : "input-standard"
                    }
                  />
                  {errors.birthDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.birthDate.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Category Interests Section */}
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 mr-2 text-red-600" />
                {t("sections.categoryInterests")}
              </h2>

              {/* Newsletter Preferences - Side by Side */}
              <div className="mb-4 md:mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Newsletter Frequency Dropdown */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.newsletterFrequency")}
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          className="w-full justify-between focus:border-purple-400 focus:ring-purple-400/50 focus:ring-[3px]"
                          disabled={isLoading}
                        >
                          {watchedValues.subscriptionPreferences
                            ?.subscriptionFrequencies
                            ? t(
                                `frequencies.${watchedValues.subscriptionPreferences.subscriptionFrequencies}`
                              )
                            : t("fields.selectFrequency")}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full" align="start">
                        {newsletterFrequencies.map((frequency) => {
                          const isSelected =
                            watchedValues.subscriptionPreferences
                              ?.subscriptionFrequencies === frequency;
                          return (
                            <DropdownMenuItem
                              key={frequency}
                              onSelect={(e) => {
                                e.preventDefault();
                                setValue(
                                  "subscriptionPreferences.subscriptionFrequencies",
                                  frequency
                                );
                                trigger(
                                  "subscriptionPreferences.subscriptionFrequencies"
                                );
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={isSelected}
                                  className="pointer-events-none"
                                />
                                <span>{t(`frequencies.${frequency}`)}</span>
                              </div>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Categories Multiselect */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.categoryInterests")}
                    </Label>
                    <DropdownMenu
                      open={categoriesDropdownOpen}
                      onOpenChange={setCategoriesDropdownOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          className="w-full justify-between focus:border-purple-400 focus:ring-purple-400/50 focus:ring-[3px]"
                          disabled={isLoading}
                        >
                          {watchedValues.subscriptionPreferences?.categories
                            ?.length > 0
                            ? `${watchedValues.subscriptionPreferences.categories.length} categories selected`
                            : t("fields.selectCategories")}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full" align="start">
                        {mainCategories.map((category) => {
                          const isSelected =
                            watchedValues.subscriptionPreferences?.categories?.includes(
                              category
                            );
                          return (
                            <DropdownMenuItem
                              key={category}
                              onSelect={(e) => {
                                // Prevent default closing behavior for multiselect
                                e.preventDefault();
                                const currentCategories =
                                  watchedValues.subscriptionPreferences
                                    ?.categories || [];
                                let newCategories: string[];

                                if (isSelected) {
                                  newCategories = currentCategories.filter(
                                    (cat) => cat !== category
                                  );
                                } else {
                                  newCategories = [
                                    ...currentCategories,
                                    category,
                                  ];
                                }

                                setValue(
                                  "subscriptionPreferences.categories",
                                  newCategories
                                );
                                trigger("subscriptionPreferences.categories");
                                // Keep dropdown open for multiselect
                                setCategoriesDropdownOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={isSelected}
                                  className="pointer-events-none"
                                />
                                <span className="capitalize">
                                  {t(`categories.${category}`)}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </section>

            <section>
              {/* Security Section */}
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
                <Lock className="w-4 h-4 md:w-5 md:h-5 mr-2 text-red-600" />
                {t("sections.security")}
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isLoading}
                    className="w-auto min-w-fit px-4"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {t("actions.resetPassword")}
                  </Button>
                  <p className="text-sm text-gray-500">
                    {t("security.resetPasswordDescription")}
                  </p>
                </div>
              </div>
            </section>

            {/* Save Button - Inline with Security Section */}
            <div className="flex flex-col items-center md:items-end space-y-2">
              <Button
                type="submit"
                disabled={isLoading || !hasChanges}
                className="w-auto min-w-fit px-4 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    <span>{t("actions.save")}</span>
                  </>
                ) : (
                  t("actions.save")
                )}
              </Button>

              {/* Help text when save button is disabled */}
              {!hasChanges && !isLoading && (
                <p className="text-sm text-gray-500 text-center md:text-right">
                  {t("messages.makeChangesToSave")}
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
