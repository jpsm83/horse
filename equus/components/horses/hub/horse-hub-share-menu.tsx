/**
 * HorseHubShareMenu — themed social share popover for the horse hub hero.
 *
 * Trigger is the shadcn Button; the popover lists react-share network buttons
 * recolored with semantic tokens (brand shapes, theme colors) plus a copy-link
 * action. Only used by HorseHubHero.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link2, Share2 } from "lucide-react";
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  PinterestIcon,
  PinterestShareButton,
  TelegramIcon,
  TelegramShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
  XShareButton,
} from "react-share";

import { Button } from "@/components/ui/button.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type HorseHubShareMenuProps = {
  horseName: string;
  shareUrl: string;
  coverUrl?: string;
};

type ShareNetworkKey =
  | "facebook"
  | "x"
  | "whatsapp"
  | "telegram"
  | "linkedin"
  | "pinterest"
  | "email";

/** Theme-token fill for every react-share icon (overrides brand colors). */
const THEMED_ICON_CLASS =
  "rounded-full [&_path]:fill-secondary-foreground [&>circle]:fill-secondary";

const NETWORK_BUTTON_CLASS =
  "rounded-full transition-opacity hover:opacity-80 focus-visible:opacity-80";

export function HorseHubShareMenu({
  horseName,
  shareUrl,
  coverUrl,
}: HorseHubShareMenuProps) {
  const t = useTranslations("horseHub");
  const toast = useAppToast();
  const [open, setOpen] = useState(false);

  const title = t("shareTitle", { name: horseName });
  const aria = (key: ShareNetworkKey) => t(`shareNetworks.${key}`);

  async function handleCopyLink() {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t("shareCopied"));
        return;
      }
    } catch {
      // fall through to error toast
    }
    toast.error(t("shareFailed"));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="default" size="sm" />}
      >
        <Share2 className="size-4" aria-hidden />
        {t("share")}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3">
        <div className="grid grid-cols-4 gap-2">
          <FacebookShareButton
            url={shareUrl}
            aria-label={aria("facebook")}
            htmlTitle={aria("facebook")}
            className={NETWORK_BUTTON_CLASS}
          >
            <FacebookIcon size={32} round className={THEMED_ICON_CLASS} />
          </FacebookShareButton>

          <XShareButton
            url={shareUrl}
            title={title}
            aria-label={aria("x")}
            htmlTitle={aria("x")}
            className={NETWORK_BUTTON_CLASS}
          >
            <XIcon size={32} round className={THEMED_ICON_CLASS} />
          </XShareButton>

          <WhatsappShareButton
            url={shareUrl}
            title={title}
            aria-label={aria("whatsapp")}
            htmlTitle={aria("whatsapp")}
            className={NETWORK_BUTTON_CLASS}
          >
            <WhatsappIcon size={32} round className={THEMED_ICON_CLASS} />
          </WhatsappShareButton>

          <TelegramShareButton
            url={shareUrl}
            title={title}
            aria-label={aria("telegram")}
            htmlTitle={aria("telegram")}
            className={NETWORK_BUTTON_CLASS}
          >
            <TelegramIcon size={32} round className={THEMED_ICON_CLASS} />
          </TelegramShareButton>

          <LinkedinShareButton
            url={shareUrl}
            title={title}
            aria-label={aria("linkedin")}
            htmlTitle={aria("linkedin")}
            className={NETWORK_BUTTON_CLASS}
          >
            <LinkedinIcon size={32} round className={THEMED_ICON_CLASS} />
          </LinkedinShareButton>

          <PinterestShareButton
            url={shareUrl}
            media={coverUrl ?? shareUrl}
            description={title}
            aria-label={aria("pinterest")}
            htmlTitle={aria("pinterest")}
            className={NETWORK_BUTTON_CLASS}
          >
            <PinterestIcon size={32} round className={THEMED_ICON_CLASS} />
          </PinterestShareButton>

          <EmailShareButton
            url={shareUrl}
            subject={title}
            aria-label={aria("email")}
            htmlTitle={aria("email")}
            className={NETWORK_BUTTON_CLASS}
          >
            <EmailIcon size={32} round className={THEMED_ICON_CLASS} />
          </EmailShareButton>
        </div>

        <Separator className="my-3" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => void handleCopyLink()}
        >
          <Link2 className="size-4" aria-hidden />
          {t("shareCopyLink")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
