export type AuthEmailTemplateContent = {
  subject: string;
  html: string;
  text: string;
};

const confirmationTranslations = {
  en: {
    subject: "Confirm Your Email - Equus",
    greeting: "Hello",
    message:
      "Welcome to Equus! Please confirm your email address by clicking the button below to complete your account setup.",
    confirmButton: "Confirm Email",
    ignoreMessage:
      "If you didn't create an account with Equus, please ignore this email.",
    expiryMessage:
      "This confirmation link will expire in 24 hours for security reasons.",
    fallbackMessage:
      "If the button above doesn't work, copy and paste this link into your browser:",
    copyright: "Equus. All rights reserved.",
  },
};

const passwordResetTranslations = {
  en: {
    subject: "Password Reset Request - Equus",
    greeting: "Hello",
    message:
      "You recently requested to reset your password for your Equus account. Click the button below to reset it.",
    resetButton: "Reset Password",
    ignoreMessage:
      "If you didn't request a password reset, please ignore this email or contact support if you have concerns.",
    expiryMessage:
      "This password reset link will expire in 1 hour for security reasons.",
    fallbackMessage:
      "If the button above doesn't work, copy and paste this link into your browser:",
    copyright: "Equus. All rights reserved.",
  },
};

function fallbackName(name?: string): string {
  return name?.trim() || "there";
}

export function buildEmailConfirmationContent(options: {
  confirmUrl: string;
  greetingName?: string;
}): AuthEmailTemplateContent {
  const t = confirmationTranslations.en;
  const username = fallbackName(options.greetingName);

  return {
    subject: t.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #374151;">${t.greeting} ${username}!</h2>
        <p style="color: #6b7280; line-height: 1.6;">${t.message}</p>
        <p><a href="${options.confirmUrl}" style="color: #2563eb;">${t.confirmButton}</a></p>
        <p style="color: #6b7280;">${t.ignoreMessage}</p>
        <p style="color: #6b7280;">${t.expiryMessage}</p>
        <p style="color: #9ca3af; font-size: 14px;">${t.fallbackMessage}<br><a href="${options.confirmUrl}">${options.confirmUrl}</a></p>
        <p style="color: #9ca3af; font-size: 12px;">${t.copyright}</p>
      </div>
    `,
    text: `${t.subject}\n\n${t.greeting} ${username}!\n\n${t.message}\n\n${options.confirmUrl}\n\n${t.ignoreMessage}\n\n${t.expiryMessage}\n\n${t.copyright}`,
  };
}

export function buildPasswordResetEmailContent(options: {
  resetUrl: string;
  greetingName?: string;
}): AuthEmailTemplateContent {
  const t = passwordResetTranslations.en;
  const username = fallbackName(options.greetingName);

  return {
    subject: t.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #374151;">${t.greeting} ${username}!</h2>
        <p style="color: #6b7280; line-height: 1.6;">${t.message}</p>
        <p><a href="${options.resetUrl}" style="color: #2563eb;">${t.resetButton}</a></p>
        <p style="color: #6b7280;">${t.ignoreMessage}</p>
        <p style="color: #6b7280;">${t.expiryMessage}</p>
        <p style="color: #9ca3af; font-size: 14px;">${t.fallbackMessage}<br><a href="${options.resetUrl}">${options.resetUrl}</a></p>
        <p style="color: #9ca3af; font-size: 12px;">${t.copyright}</p>
      </div>
    `,
    text: `${t.subject}\n\n${t.greeting} ${username}!\n\n${t.message}\n\n${options.resetUrl}\n\n${t.ignoreMessage}\n\n${t.expiryMessage}\n\n${t.copyright}`,
  };
}
