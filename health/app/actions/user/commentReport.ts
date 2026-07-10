'use server';

import * as nodemailer from "nodemailer";

// Shared email utilities
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const validateEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error(
      "Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD environment variables."
    );
  }
};

const sendEmailWithTransporter = async (mailOptions: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail(mailOptions);
  return { success: true, data: { messageId: info.messageId } };
};

// Email content translations
const emailTranslations = {
  en: {
    subject: "Comment Report Notification - Women's Spot",
    greeting: "Hello",
    message: "Your comment has been reported by another user and is currently under review by our moderation team.",
    reportReason: "Report Reason",
    reportAction: "What happens next?",
    reportActionText: "Our moderation team will review your comment and the report. If the comment violates our community guidelines, it may be removed. If it's found to be appropriate, it will remain visible.",
    reportAppeal: "If you believe this report was made in error, you can contact our support team.",
    reportContact: "Contact Support",
    reportThankYou: "Thank you for being part of our community and helping us maintain a safe environment for everyone.",
    copyright: "© 2025 Women's Spot. All rights reserved.",
  },
  pt: {
    subject: "Notificação de Denúncia de Comentário - Women's Spot",
    greeting: "Olá",
    message: "Seu comentário foi denunciado por outro usuário e está atualmente sob revisão pela nossa equipe de moderação.",
    reportReason: "Motivo da Denúncia",
    reportAction: "O que acontece agora?",
    reportActionText: "Nossa equipe de moderação revisará seu comentário e a denúncia. Se o comentário violar nossas diretrizes da comunidade, ele pode ser removido. Se for considerado apropriado, permanecerá visível.",
    reportAppeal: "Se você acredita que esta denúncia foi feita por engano, pode entrar em contato com nossa equipe de suporte.",
    reportContact: "Contatar Suporte",
    reportThankYou: "Obrigado por fazer parte da nossa comunidade e nos ajudar a manter um ambiente seguro para todos.",
    copyright: "© 2025 Women's Spot. Todos os direitos reservados.",
  },
  es: {
    subject: "Notificación de Reporte de Comentario - Women's Spot",
    greeting: "Hola",
    message: "Tu comentario ha sido reportado por otro usuario y está actualmente bajo revisión por nuestro equipo de moderación.",
    reportReason: "Motivo del Reporte",
    reportAction: "¿Qué sucede ahora?",
    reportActionText: "Nuestro equipo de moderación revisará tu comentario y el reporte. Si el comentario viola nuestras pautas de la comunidad, puede ser removido. Si se considera apropiado, permanecerá visible.",
    reportAppeal: "Si crees que este reporte fue hecho por error, puedes contactar a nuestro equipo de soporte.",
    reportContact: "Contactar Soporte",
    reportThankYou: "Gracias por ser parte de nuestra comunidad y ayudarnos a mantener un ambiente seguro para todos.",
    copyright: "© 2025 Women's Spot. Todos los derechos reservados.",
  },
  fr: {
    subject: "Notification de Signalement de Commentaire - Women's Spot",
    greeting: "Bonjour",
    message: "Votre commentaire a été signalé par un autre utilisateur et est actuellement en cours d'examen par notre équipe de modération.",
    reportReason: "Motif du Signalement",
    reportAction: "Que se passe-t-il maintenant ?",
    reportActionText: "Notre équipe de modération examinera votre commentaire et le signalement. Si le commentaire viole nos directives communautaires, il peut être supprimé. S'il est jugé approprié, il restera visible.",
    reportAppeal: "Si vous pensez que ce signalement a été fait par erreur, vous pouvez contacter notre équipe de support.",
    reportContact: "Contacter le Support",
    reportThankYou: "Merci de faire partie de notre communauté et de nous aider à maintenir un environnement sûr pour tous.",
    copyright: "© 2025 Women's Spot. Tous droits réservés.",
  },
  de: {
    subject: "Kommentar-Meldung Benachrichtigung - Women's Spot",
    greeting: "Hallo",
    message: "Ihr Kommentar wurde von einem anderen Benutzer gemeldet und wird derzeit von unserem Moderations-Team überprüft.",
    reportReason: "Meldungsgrund",
    reportAction: "Was passiert als nächstes?",
    reportActionText: "Unser Moderations-Team wird Ihren Kommentar und die Meldung überprüfen. Wenn der Kommentar unsere Community-Richtlinien verletzt, kann er entfernt werden. Wenn er als angemessen befunden wird, bleibt er sichtbar.",
    reportAppeal: "Wenn Sie glauben, dass diese Meldung fälschlicherweise gemacht wurde, können Sie unser Support-Team kontaktieren.",
    reportContact: "Support Kontaktieren",
    reportThankYou: "Vielen Dank, dass Sie Teil unserer Community sind und uns helfen, eine sichere Umgebung für alle zu schaffen.",
    copyright: "© 2025 Women's Spot. Alle Rechte vorbehalten.",
  },
  it: {
    subject: "Notifica Segnalazione Commento - Women's Spot",
    greeting: "Ciao",
    message: "Il tuo commento è stato segnalato da un altro utente ed è attualmente in revisione dal nostro team di moderazione.",
    reportReason: "Motivo della Segnalazione",
    reportAction: "Cosa succede ora?",
    reportActionText: "Il nostro team di moderazione esaminerà il tuo commento e la segnalazione. Se il commento viola le nostre linee guida della community, potrebbe essere rimosso. Se è ritenuto appropriato, rimarrà visibile.",
    reportAppeal: "Se ritieni che questa segnalazione sia stata fatta per errore, puoi contattare il nostro team di supporto.",
    reportContact: "Contatta il Supporto",
    reportThankYou: "Grazie per far parte della nostra community e aiutarci a mantenere un ambiente sicuro per tutti.",
    copyright: "© 2025 Women's Spot. Tutti i diritti riservati.",
  }
};

// Comment report email template
const commentReportTemplate = (commentText: string, reason: string, articleTitle: string, username: string, locale: string = 'en') => {
  const t = emailTranslations[locale as keyof typeof emailTranslations] || emailTranslations.en;
  
  return {
    subject: t.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(to right, #b040b2, #f53b80); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">
              <span style="margin-right: 0.5em;">🤍</span>Women&apos;s Spot
            </h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <h2 style="color: #374151; margin-bottom: 20px;">${t.greeting} ${username}!</h2>
            
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              ${t.message}
            </p>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
              <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">Article: ${articleTitle}</h3>
              <p style="color: #6b7280; margin-bottom: 10px; font-weight: 600;">Your Comment:</p>
              <p style="color: #374151; font-style: italic; background-color: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #f43f5e; margin-bottom: 15px;">
                "${commentText}"
              </p>
              <p style="color: #6b7280; margin-bottom: 5px; font-weight: 600;">${t.reportReason}:</p>
              <p style="color: #f43f5e; font-weight: bold; margin: 0;">${reason}</p>
            </div>
            
            <h3 style="color: #374151; margin-bottom: 15px;">${t.reportAction}</h3>
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              ${t.reportActionText}
            </p>
            
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              ${t.reportAppeal}
            </p>
            
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              ${t.reportThankYou}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
              ${t.copyright}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      ${t.subject}
      
      ${t.greeting} ${username}!
      
      ${t.message}
      
      Article: ${articleTitle}
      Your Comment: "${commentText}"
      ${t.reportReason}: ${reason}
      
      ${t.reportAction}
      ${t.reportActionText}
      
      ${t.reportAppeal}
      
      ${t.reportThankYou}
      
      ${t.copyright}
    `
  };
};

export default async function sendCommentReportEmailAction(
  email: string,
  username: string,
  commentText: string,
  reason: string,
  articleTitle: string,
  locale: string = 'en'
) {
  try {
    validateEmailConfig();

    const emailContent = commentReportTemplate(commentText, reason, articleTitle, username, locale);

    const mailOptions = {
      from: `"Women's Spot" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    };

    return await sendEmailWithTransporter(mailOptions);
  } catch (error) {
    console.error('Comment report email action failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send comment report email' 
    };
  }
}
