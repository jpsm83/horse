"use client";

import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailShareButton,
  TelegramShareButton,
  LinkedinShareButton,
  FacebookMessengerShareButton,
} from "react-share";
import {
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  EmailIcon,
  TelegramIcon,
  LinkedinIcon,
  FacebookMessengerIcon,
} from "react-share";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  media?: string;
  video?: string;
  className?: string;
}

export default function SocialShare({
  url,
  title,
  description,
  media: _media, // eslint-disable-line @typescript-eslint/no-unused-vars
  video: _video, // eslint-disable-line @typescript-eslint/no-unused-vars
  className = "",
}: SocialShareProps) {
  const shareUrl = url;
  const shareTitle = title;
  const shareDescription = description || title;

  // Button styles for consistency
  const buttonStyles =
    "rounded-full transition-all duration-200 cursor-pointer w-10 h-10 flex items-center justify-center";

  const shareButtons = [
    {
      name: "Facebook",
      component: (
        <FacebookShareButton url={shareUrl} className={buttonStyles}>
          <FacebookIcon className="size-6 hover:size-7 transition-all duration-200" round />
        </FacebookShareButton>
      ),
    },
    {
      name: "X (Twitter)",
      component: (
        <TwitterShareButton
          url={shareUrl}
          title={shareTitle}
          className={buttonStyles}
        >
          <TwitterIcon className="size-6 hover:size-7 transition-all duration-200" round />
        </TwitterShareButton>
      ),
    },
    {
      name: "WhatsApp",
      component: (
        <WhatsappShareButton
          url={shareUrl}
          title={shareTitle}
          className={buttonStyles}
        >
          <WhatsappIcon className="size-6 hover:size-7 transition-all duration-200" round />
        </WhatsappShareButton>
      ),
    },
    {
      name: "Email",
      component: (
        <EmailShareButton
          url={shareUrl}
          subject={shareTitle}
          body={shareDescription}
          className={buttonStyles}
        >
          <EmailIcon className="size-6 hover:size-7 transition-all duration-200" round />
        </EmailShareButton>
      ),
    },
    {
      name: "Telegram",
      component: (
        <TelegramShareButton
          url={shareUrl}
          title={shareTitle}
          className={buttonStyles}
        >
          <TelegramIcon className="size-6 hover:size-7 transition-all duration-200" round />
        </TelegramShareButton>
      ),
    },
    {
      name: "LinkedIn",
      component: (
        <LinkedinShareButton
          url={shareUrl}
          title={shareTitle}
          summary={shareDescription}
          className={buttonStyles}
        >
          <LinkedinIcon className="size-6 hover:size-7 transition-all duration-200" round />
        </LinkedinShareButton>
      ),
    },
    {
      name: "Facebook Messenger",
      component: (
        <FacebookMessengerShareButton
          url={shareUrl}
          appId=""
          className={buttonStyles}
        >
          <FacebookMessengerIcon className="size-6 hover:size-7 transition-all duration-200" round />
        </FacebookMessengerShareButton>
      ),
    },
  ];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-wrap gap-2 justify-center">
        {shareButtons.map((button) => (
          <div key={button.name} className="flex items-center">
            {button.component}
          </div>
        ))}
      </div>
    </div>
  );
}
