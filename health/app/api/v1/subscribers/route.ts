import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/app/api/utils/handleApiError";
import Subscriber from "@/app/api/models/subscriber";
import * as nodemailer from "nodemailer";
import {
  getSubscribersService,
  subscribeToNewsletterService,
  unsubscribeFromNewsletterService,
} from "@/lib/services/subscribers";
import { generateEmailLink } from "@/lib/utils/emailLinkGenerator";
import { getBaseUrlFromRequest } from "@/lib/utils/getBaseUrl";

// @desc    Get all subscribers
// @route   GET /subscribers
// @access  Private (Admin only)
export const GET = async () => {
  try {
    const subscribers = await getSubscribersService();

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No subscribers found!",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: subscribers.length,
        data: subscribers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get subscribers failed:", error);
    return handleApiError("Get subscribers failed!", error as string);
  }
};

// Email validation function
const validateEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Extract domain from email
    const domain = email.split('@')[1];
    
    // Check if it's a common disposable email domain
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
      'mailinator.com', 'throwaway.email', 'temp-mail.org'
    ];
    
    if (disposableDomains.includes(domain.toLowerCase())) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email validation error:', error);
    return false;
  }
};

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


// @desc    Subscribe to newsletter
// @route   POST /subscribers
// @access  Public
export const POST = async (req: NextRequest) => {
  try {
    const { email, preferences } = await req.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required!",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address!",
          error: "INVALID_EMAIL"
        },
        { status: 400 }
      );
    }

    // Subscribe using service
    let subscribeResult;
    try {
      subscribeResult = await subscribeToNewsletterService({ email, preferences });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";
      
      if (errorMessage.includes("already registered") || errorMessage.includes("USER_EXISTS")) {
        return NextResponse.json(
          {
            success: false,
            message: errorMessage,
            error: "USER_EXISTS"
          },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes("valid email")) {
        return NextResponse.json(
          {
            success: false,
            message: errorMessage,
            error: "INVALID_EMAIL"
          },
          { status: 400 }
        );
      }
      
      throw serviceError;
    }

    const subscriber = subscribeResult.subscriber;

    // Validate email before sending confirmation
    const isEmailValid = await validateEmailExists(subscriber.email);
    if (!isEmailValid) {
      // Remove the subscriber record if email is invalid
      await Subscriber.findByIdAndDelete(subscriber._id);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address. Please use a valid email address.",
          error: "INVALID_EMAIL_ADDRESS"
        },
        { status: 400 }
      );
    }

    // Get verification token from DB for email link
    const subscriberWithToken = await Subscriber.findById(subscriber._id).select("verificationToken unsubscribeToken");
    if (!subscriberWithToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to retrieve subscriber token",
        },
        { status: 500 }
      );
    }

    // Send confirmation email
    // Note: Newsletter subscribers may not have a user account, so default to "en"
    // TODO: Consider storing language preference in subscriber model in the future
    const subscriberLocale = "en";
    
    // Get base URL from request
    const baseUrl = getBaseUrlFromRequest(req);
    
    const confirmLink = await generateEmailLink(
      "confirm-newsletter",
      {
        token: subscriberWithToken.verificationToken,
        email: subscriber.email,
      },
      subscriberLocale,
      baseUrl
    );
    
    const unsubscribeLink = await generateEmailLink(
      "unsubscribe",
      {
        email: subscriber.email,
        token: subscriberWithToken.unsubscribeToken,
      },
      subscriberLocale,
      baseUrl
    );
    
    try {
      validateEmailConfig();
      
      const emailContent = {
        subject: "Confirm Your Newsletter Subscription - Women's Spot",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ec4899; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px; color: white;">
                <span style="margin-right: 0.5em;">🤍</span>Women&apos;s Spot
              </h1>
            </div>
            <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
              <h2 style="color: #374151; margin-bottom: 20px;">Welcome to our community ${email.split('@')[0]}!</h2>
              <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
                Thank you for subscribing to our newsletter! Please confirm your subscription by clicking the button below.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmLink}" style="background-color: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  Confirm Subscription
                </a>
              </div>
              <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
                If you didn't subscribe to our newsletter, please ignore this email.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="${confirmLink}" style="color: #ec4899;">${confirmLink}</a>
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>© 2025 Women&apos;s Spot. All rights reserved.</p>
              <p style="margin-top: 10px;">
                If you no longer wish to receive our newsletter, you can 
                <a href="${unsubscribeLink}" style="color: #ec4899; text-decoration: underline;">unsubscribe here</a>.
              </p>
            </div>
          </div>
        `,
        text: `Confirm Your Newsletter Subscription - Women's Spot\n\nWelcome to our community ${email.split('@')[0]}!\n\nThank you for subscribing to our newsletter! Please confirm your subscription by clicking the link below.\n\n${confirmLink}\n\nIf you didn't subscribe to our newsletter, please ignore this email.\n\n© 2025 Women's Spot. All rights reserved.\n\nIf you no longer wish to receive our newsletter, you can unsubscribe here: ${unsubscribeLink}`
      };

      const mailOptions = {
        from: `"Women's Spot" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      };

      await sendEmailWithTransporter(mailOptions);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      
      // Check if it's a bounce error (email doesn't exist)
      const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
      if (errorMessage.includes('bounce') || 
          errorMessage.includes('invalid') || 
          errorMessage.includes('not found') ||
          errorMessage.includes('does not exist')) {
        
        // Remove the subscriber record if email bounces
        await Subscriber.findByIdAndDelete(subscriber._id);
        return NextResponse.json(
          {
            success: false,
            message: "Invalid email address. Please use a valid email address.",
            error: "EMAIL_BOUNCED"
          },
          { status: 400 }
        );
      }
      
      // For other email errors, don't fail the subscription but log the error
      console.error("Email sending failed but subscription will continue:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Please check your email to confirm your subscription!"
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return handleApiError("Subscribe to newsletter failed!", error as string);
  }
};

// @desc    Unsubscribe from newsletter
// @route   DELETE /subscribers
// @access  Public
export const DELETE = async (req: NextRequest) => {
  try {
    const { email, token } = await req.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required!",
          error: "MISSING_EMAIL"
        },
        { status: 400 }
      );
    }

    try {
      const result = await unsubscribeFromNewsletterService({ email, token });

      if (result.hasUserAccount) {
        return NextResponse.json(
          {
            success: true,
            message: "Successfully unsubscribed from newsletter! You can manage your preferences in your profile."
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          {
            success: true,
            message: "Successfully unsubscribed from newsletter! All your data has been removed."
          },
          { status: 200 }
        );
      }
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";
      
      if (errorMessage.includes("not found")) {
        return NextResponse.json(
          {
            success: false,
            message: "Subscriber not found!",
            error: "SUBSCRIBER_NOT_FOUND"
          },
          { status: 404 }
        );
      }
      
      if (errorMessage.includes("Invalid unsubscribe link") || errorMessage.includes("INVALID_TOKEN")) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid unsubscribe link!",
            error: "INVALID_TOKEN"
          },
          { status: 400 }
        );
      }
      
      throw serviceError;
    }
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return handleApiError("Unsubscribe failed!", error as string);
  }
};
