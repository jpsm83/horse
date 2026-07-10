import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import { handleApiError } from "@/app/api/utils/handleApiError";
import isObjectIdValid from "@/app/api/utils/isObjectIdValid";
import connectDb from "@/app/api/db/connectDb";
import Subscriber from "@/app/api/models/subscriber";
import { mainCategories, newsletterFrequencies } from "@/lib/constants";
import {
  getSubscriberByIdService,
  updateSubscriberPreferencesService,
} from "@/lib/services/subscribers";

// @desc    Get subscriber by subscriberId
// @route   GET /subscribers/[subscriberId]
// @access  Private
export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ subscriberId: string }> }
) => {
  try {
    const { subscriberId } = await context.params;

    // Validate ObjectId
    if (!isObjectIdValid([subscriberId])) {
      return NextResponse.json(
        { message: "Invalid subscriber ID format" },
        { status: 400 }
      );
    }

    const subscriber = await getSubscriberByIdService(subscriberId);

    if (!subscriber) {
      return NextResponse.json(
        { message: "Subscriber not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscriber, { status: 200 });
  } catch (error) {
    return handleApiError(
      "Get subscriber by subscriberId failed!",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};

// @desc    Update subscriber preferences
// @route   PATCH /subscribers/[subscriberId]
// @access  Private
export const PATCH = async (
  req: Request,
  context: { params: Promise<{ subscriberId: string }> }
) => {
  try {
    // validate session
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          message: "You must be signed in to update subscriber preferences",
        },
        { status: 401 }
      );
    }

    const { subscriberId } = await context.params;

    // Validate ObjectId
    if (!isObjectIdValid([subscriberId])) {
      return NextResponse.json(
        { message: "Invalid subscriber ID format" },
        { status: 400 }
      );
    }

    // Parse JSON body
    const body = await req.json();
    const { subscriptionPreferences } = body;

    // Validate subscription preferences
    if (
      !subscriptionPreferences ||
      !subscriptionPreferences.categories ||
      !subscriptionPreferences.subscriptionFrequencies
    ) {
      return NextResponse.json(
        { message: "Invalid subscription preferences format" },
        { status: 400 }
      );
    }

    // Validate categories
    if (
      !Array.isArray(subscriptionPreferences.categories) ||
      !subscriptionPreferences.categories.every((cat: string) =>
        mainCategories.includes(cat)
      )
    ) {
      return NextResponse.json(
        { message: "Invalid categories provided" },
        { status: 400 }
      );
    }

    // Validate subscription frequency
    if (
      !newsletterFrequencies.includes(
        subscriptionPreferences.subscriptionFrequencies
      )
    ) {
      return NextResponse.json(
        { message: "Invalid subscription frequency provided" },
        { status: 400 }
      );
    }

    // Check authorization first
    await connectDb();
    const subscriber = await Subscriber.findById(subscriberId);

    if (!subscriber) {
      return NextResponse.json(
        { message: "Subscriber not found" },
        { status: 404 }
      );
    }

    // Check if the subscriber belongs to the authenticated user
    if (subscriber.userId?.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "You are not authorized to update this subscriber!" },
        { status: 403 }
      );
    }

    // Update subscriber preferences using service
    const updatedSubscriber = await updateSubscriberPreferencesService({
      subscriberId,
      subscriptionPreferences,
    });

    return NextResponse.json(
      {
        message: "Subscriber preferences updated successfully",
        data: updatedSubscriber,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(
      "Update subscriber preferences failed!",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};
