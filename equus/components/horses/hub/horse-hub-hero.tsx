/**
 * HorseHubHero — Hub tab identity banner (cover, avatar, name, share, quick stats).
 *
 * Full-bleed: negative margins cancel HorseLayoutChrome's page padding so the hero
 * touches the sidebar, tab navbar, and right screen edge. The cover image fills the
 * entire hero; identity (avatar, name, registered name, inline stats) overlays it
 * bottom-left with Share top-right. Owners can upload profile/hero via
 * ProfilePhotoField (immediate media upload + PATCH).
 * Guests see read-only images. Assembled by HubContent.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Calendar,
  Dna,
  Ruler,
  Sparkles,
  VenusAndMars,
} from "lucide-react";
import { useState } from "react";

import { HorseHubShareMenu } from "@/components/horses/hub/horse-hub-share-menu.tsx";
import { FavoriteStarButton } from "@/components/shared/favorite-star-button.tsx";
import { FlagIcon } from "@/components/shared/country-flag.tsx";
import { LoadingOverlay } from "@/components/shared/loading-overlay.tsx";
import { ProfilePhotoField } from "@/components/shared/profile-photo-field.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { useUpdateHorse } from "@/hooks/queries/useHorse.ts";
import { useUploadMedia } from "@/hooks/queries/useMedia.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { HorseViewDto } from "@/lib/services/horseService.ts";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { cn } from "@/lib/utils";
import {
  horseBreedEnums,
  horseColorEnums,
  horseSexEnums,
} from "@/utils/enums.ts";

type HorseHubHeroProps = {
  horse: HorseViewDto;
  shareUrl: string;
  canEditImages?: boolean;
  className?: string;
};

type HubStat = {
  key: string;
  label: string;
  value: string;
  Icon: typeof Dna;
};

function horseInitials(name?: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function HorseHubHero({
  horse,
  shareUrl,
  canEditImages = false,
  className,
}: HorseHubHeroProps) {
  const t = useTranslations("horseHub");
  const tCreate = useTranslations("createHorse");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const toast = useAppToast();
  const uploadMedia = useUploadMedia(horse.id);
  const updateHorse = useUpdateHorse();

  const [profilePreview, setProfilePreview] = useState<string | undefined>();
  const [heroPreview, setHeroPreview] = useState<string | undefined>();
  const [uploadingRole, setUploadingRole] = useState<"profile" | "hero" | null>(
    null,
  );

  const identity = horse.sections.identity;
  const coverUrl =
    heroPreview ?? horse.heroImageUrl ?? horse.profileImageUrl ?? undefined;
  const avatarUrl = profilePreview ?? horse.profileImageUrl;
  const registeredName = identity?.registeredName;
  const countryCode = identity?.countryOfBirth;
  const isBusy = uploadingRole !== null;

  const photoLabels = {
    photoChange: t("photoChange"),
    photoRemovePreview: t("photoRemovePreview"),
    photoInvalidType: t("photoInvalidType"),
    photoTooLarge: t("photoTooLarge"),
  };

  async function uploadAndSet(
    file: File,
    role: "profile" | "hero",
  ): Promise<void> {
    setUploadingRole(role);
    try {
      const uploaded = await uploadMedia.mutateAsync({
        files: [file],
        fileIds: ["hub-upload"],
        descriptions: { "hub-upload": "" },
        sourceEntityType: "horse",
        sourceEntityId: horse.id,
      });
      const url = uploaded[0]?.url;
      if (!url) {
        throw new Error("missing url");
      }
      await updateHorse.mutateAsync({
        horseId: horse.id,
        patch:
          role === "profile"
            ? { profileImageUrl: url }
            : { heroImageUrl: url },
      });
      toast.success(
        role === "profile" ? t("profileImageUpdated") : t("heroImageUpdated"),
      );
      if (role === "profile") {
        if (profilePreview?.startsWith("blob:")) {
          URL.revokeObjectURL(profilePreview);
        }
        setProfilePreview(undefined);
      } else {
        if (heroPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(heroPreview);
        }
        setHeroPreview(undefined);
      }
    } catch {
      toast.error(role === "profile" ? t("profileImageError") : t("heroImageError"));
    } finally {
      setUploadingRole(null);
    }
  }

  function breedLabel(breed?: string): string {
    if (!breed) return t("emptyValue");
    const key = `breedOptions.${breed}` as const;
    if (
      !(horseBreedEnums as readonly string[]).includes(breed) ||
      !tCreate.has(key)
    ) {
      return breed;
    }
    return tCreate(key as "breedOptions.Other");
  }

  function sexLabel(sex?: string): string {
    if (!sex) return t("emptyValue");
    const key = `sexOptions.${sex}` as const;
    if (
      !(horseSexEnums as readonly string[]).includes(sex) ||
      !tCreate.has(key)
    ) {
      return sex;
    }
    return tCreate(key as "sexOptions.Mare");
  }

  function colorLabel(color?: string): string {
    if (!color) return t("emptyValue");
    const key = `colorOptions.${color}` as const;
    if (
      !(horseColorEnums as readonly string[]).includes(color) ||
      !tCreate.has(key)
    ) {
      return color;
    }
    return tCreate(key as "colorOptions.Bay");
  }

  function birthdayLabel(iso?: string): string {
    if (!iso) return t("emptyValue");
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return t("emptyValue");
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  const heightValue =
    identity?.heightHands != null
      ? t("heightHands", { value: identity.heightHands })
      : t("emptyValue");

  const stats: HubStat[] = identity
    ? [
        {
          key: "breed",
          label: t("breed"),
          value: breedLabel(horse.breed),
          Icon: Dna,
        },
        {
          key: "sex",
          label: t("sex"),
          value: sexLabel(horse.sex),
          Icon: VenusAndMars,
        },
        {
          key: "color",
          label: t("color"),
          value: colorLabel(identity.color),
          Icon: Sparkles,
        },
        {
          key: "height",
          label: t("height"),
          value: heightValue,
          Icon: Ruler,
        },
        {
          key: "birthday",
          label: t("birthday"),
          value: birthdayLabel(identity.dateOfBirth),
          Icon: Calendar,
        },
      ]
    : [];

  return (
    <div
      className={cn(
        "relative -mx-4 -mt-4 overflow-hidden sm:-mx-6 sm:-mt-6",
        className,
      )}
    >
      <LoadingOverlay active={isBusy} label={tCommon("loading")} />

      {/* Full-bleed background image fills the entire hero */}
      {canEditImages ? (
        <ProfilePhotoField
          variant="cover"
          fill
          className="absolute inset-0"
          imageUrl={horse.heroImageUrl ?? horse.profileImageUrl}
          previewUrl={heroPreview}
          initials={horseInitials(horse.name)}
          disabled={isBusy}
          labels={photoLabels}
          onFileSelect={(file) => {
            if (!file) return;
            if (heroPreview?.startsWith("blob:")) {
              URL.revokeObjectURL(heroPreview);
            }
            setHeroPreview(URL.createObjectURL(file));
            void uploadAndSet(file, "hero");
          }}
          onPreviewClear={() => {
            if (heroPreview?.startsWith("blob:")) {
              URL.revokeObjectURL(heroPreview);
            }
            setHeroPreview(undefined);
          }}
          onError={(message) => toast.error(message)}
        />
      ) : coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      {/* Readability scrim over the image (stronger bottom-left) */}
      <div className="absolute inset-0 pointer-events-none bg-linear-to-tr from-overlay from-0% via-transparent via-50%" />
 
      <div className="absolute inset-0 pointer-events-none bg-linear-to-bl from-overlay from-0% via-transparent via-20%" />
 
      
      {/* Content overlaid on top of the image */}
      <div className="relative z-10 flex min-h-40 flex-col sm:min-h-60 h-full pointer-events-none">
        <div className="flex justify-end gap-1 p-4 pb-0 sm:p-6 sm:pb-0 pointer-events-auto">
          <FavoriteStarButton entityType="horse" entityId={horse.id} />
          <HorseHubShareMenu
            horseName={horse.name ?? ""}
            shareUrl={shareUrl}
            coverUrl={coverUrl}
          />
        </div>

        <div className="mt-auto flex min-w-0 flex-1 items-center gap-4 p-4 sm:gap-8 sm:p-6">
          <div className="relative shrink-0 pointer-events-auto">
            {canEditImages ? (
              <div className="rounded-full border-4 border-card bg-card">
                <ProfilePhotoField
                  variant="avatar"
                  avatarSize="xl"
                  imageUrl={horse.profileImageUrl}
                  previewUrl={profilePreview}
                  initials={horseInitials(horse.name)}
                  disabled={isBusy}
                  labels={photoLabels}
                  onFileSelect={(file) => {
                    if (!file) return;
                    if (profilePreview?.startsWith("blob:")) {
                      URL.revokeObjectURL(profilePreview);
                    }
                    setProfilePreview(URL.createObjectURL(file));
                    void uploadAndSet(file, "profile");
                  }}
                  onPreviewClear={() => {
                    if (profilePreview?.startsWith("blob:")) {
                      URL.revokeObjectURL(profilePreview);
                    }
                    setProfilePreview(undefined);
                  }}
                  onError={(message) => toast.error(message)}
                />
              </div>
            ) : (
              <Avatar className="size-20 border-4 border-card sm:size-40">
                <AvatarImage src={avatarUrl} alt={horse.name ?? ""} />
                <AvatarFallback>{horseInitials(horse.name)}</AvatarFallback>
              </Avatar>
            )}
            {countryCode ? (
              <span className="absolute flex items-center justify-center bottom-2 -right-1 shadow-sm border-4 border-card bg-card rounded-full">
                <FlagIcon code={countryCode} sizeClass="h-9 w-9" />
              </span>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-6 pb-1">
            <div className="flex flex-col gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {horse.name ?? t("emptyValue")}
            </h1>
            {registeredName ? (
              <p className="truncate text-sm sm:text-md text-muted-foreground">
                {t("registeredNameLabel", { name: registeredName })}
              </p>
            ) : null}
            </div>
            {stats.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-overlay-foreground/20 pt-4 w-140">
                {stats.map(({ key, label, value, Icon }) => (
                  <div
                    key={key}
                    className="flex min-w-0 items-center gap-1.5 border-l border-overlay-foreground/20 pl-4 first:border-l-0 first:pl-0"
                  >
                    <Icon
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <div className="flex min-w-0 flex-col leading-tight">
                      <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                        {label}
                      </p>
                      <p className="truncate text-sm font-medium text-foreground">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
