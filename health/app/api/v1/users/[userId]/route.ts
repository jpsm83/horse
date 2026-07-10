import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import connectDb from "@/app/api/db/connectDb";
import isObjectIdValid from "@/app/api/utils/isObjectIdValid";
import User from "@/app/api/models/user";
import uploadFilesCloudinary from "@/lib/cloudinary/uploadFilesCloudinary";
import deleteFilesCloudinary from "@/lib/cloudinary/deleteFilesCloudinary";
import { IUser, IUserPreferences } from "@/types/user";
import { roles } from "@/lib/constants";
import {
  getUserByIdService,
  deactivateUserService,
  updateUserService,
} from "@/lib/services/users";

// @desc    Get user by userId
// @route   GET /users/[userId]
// @access  Public
export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) => {
  try {
    const { userId } = await context.params;

    // Validate ObjectId
    if (!isObjectIdValid([userId])) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const user = await getUserByIdService(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Get user by userId failed:", error);
    return NextResponse.json(
      {
        message: "Get user by userId failed!",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

// @desc    Update user
// @route   PATCH /users/[userId]
// @access  Private
export const PATCH = async (
  req: Request,
  context: { params: Promise<{ userId: string }> }
) => {
  try {
    // validate session
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          message: "You must be signed in to update a user",
        },
        { status: 401 }
      );
    }

    const { userId } = await context.params;

    // Parse FORM DATA
    const formData = await req.formData();

    // Extract fields from formData
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const birthDate = formData.get("birthDate") as string;
    const imageFile = formData.get("imageFile") as File;

    // Preferences
    const language = formData.get("language") as string;
    const region = formData.get("region") as string;

    // Validate ObjectId
    if (!isObjectIdValid([userId])) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!username || !email || !role || !birthDate || !language || !region) {
      return NextResponse.json(
        {
          message:
            "Username, email, role, birthDate, language and region are required!",
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDb();

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if the user is the same user (authorization)
    if (user.id !== session.user.id) {
      return NextResponse.json(
        { message: "You are not authorized to update this user!" },
        { status: 403 }
      );
    }

    // Prepare update object
    const updateData: Partial<IUser> = {};

    // Validate and update username
    if (user.username !== username) updateData.username = username;

    // Validate and update email
    if (user.email !== email) {
      const duplicateEmail = await User.findOne({
        email,
        _id: { $ne: userId },
      });
      if (duplicateEmail) {
        return NextResponse.json(
          { message: "Email is already taken by another user" },
          { status: 409 }
        );
      }
      updateData.email = email;
    }

    // Validate and update role
    if (!roles.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    if (user.role !== role) updateData.role = role;

    // Update birth date
    const parsedBirthDate = new Date(birthDate);
    if (user.birthDate.toISOString() !== parsedBirthDate.toISOString()) {
      updateData.birthDate = parsedBirthDate;
    }

    // Update preferences
    const preferences: IUserPreferences = {
      language,
      region,
    };
    if (JSON.stringify(user.preferences) !== JSON.stringify(preferences)) {
      updateData.preferences = preferences;
    }

    // Handle image upload if provided
    const isNewImageProvided =
      imageFile &&
      imageFile instanceof File &&
      imageFile.size > 0 &&
      imageFile.name !== user.imageFile;

    const deleteUserImage = async () => {
      if (user.imageFile) {
        const deleteResult: string | boolean = await deleteFilesCloudinary(
          user.imageUrl || ""
        );
        if (deleteResult !== true) {
          return {
            success: false,
            message: deleteResult as string,
          };
        }
      }
      return { success: true };
    };

    if (isNewImageProvided) {
      const folder = `/users/${userId}`;

      const uploadResponse = await uploadFilesCloudinary({
        folder,
        filesArr: [imageFile],
        onlyImages: true,
      });

      const isUploadValid =
        Array.isArray(uploadResponse) &&
        uploadResponse.length > 0 &&
        uploadResponse.every((url) => url.includes("https://"));

      if (!isUploadValid) {
        return NextResponse.json(
          {
            message: `Error uploading image: ${uploadResponse}`,
          },
          { status: 400 }
        );
      }

      const deleteResult = await deleteUserImage();
      if (!deleteResult.success) {
        return NextResponse.json(
          { message: deleteResult.message },
          { status: 400 }
        );
      }

      updateData.imageFile = imageFile.name;
      updateData.imageUrl = uploadResponse[0];
    } else {
      // CASE: No new image provided at all (imageFile is undefined/null/empty)
      const isImageFileMissingOrEmpty =
        !imageFile || !(imageFile instanceof File) || imageFile.size === 0;

      if (isImageFileMissingOrEmpty && user.imageFile) {
        const deleteResult = await deleteUserImage();
        if (!deleteResult.success) {
          return NextResponse.json(
            { message: deleteResult.message },
            { status: 400 }
          );
        }

        await User.updateOne(
          { _id: userId },
          {
            $unset: {
              imageFile: "",
              imageUrl: "",
            },
          }
        );
      }
    }

    // Update user using service
    try {
      await updateUserService({
        userId,
        updateData,
      });

      // Fetch updated user to return in response
      const updatedUser = await getUserByIdService(userId);

      if (!updatedUser) {
        return NextResponse.json(
          { message: "User not found after update" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          message: "User updated successfully",
          data: updatedUser,
        },
        { status: 200 }
      );
    } catch (serviceError) {
      const errorMessage =
        serviceError instanceof Error ? serviceError.message : "Unknown error";

      if (errorMessage.includes("not found")) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      throw serviceError;
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: "Update user failed!",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

// @desc    Deactivate user
// @route   DELETE /users/[userId]
// @access  Private
export const DELETE = async (
  req: Request,
  context: { params: Promise<{ userId: string }> }
) => {
  try {
    // validate session
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          message: "You must be signed in to deactivate a user",
        },
        { status: 401 }
      );
    }

    const { userId } = await context.params;

    // Validate ObjectId
    if (!isObjectIdValid([userId])) {
      return NextResponse.json(
        { message: "Invalid user ID format!" },
        { status: 400 }
      );
    }

    // Check authorization first
    await connectDb();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found!" }, { status: 404 });
    }

    if (user.id !== session.user.id) {
      return NextResponse.json(
        { message: "You are not authorized to deactivate this user!" },
        { status: 403 }
      );
    }

    // Deactivate user using service
    await deactivateUserService(userId);

    return NextResponse.json(
      { message: "User deactivated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Deactivate user failed!",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
