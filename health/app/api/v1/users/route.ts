import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { isValidUrl } from "@/lib/utils/isValidUrl";
import uploadFilesCloudinary from "@/lib/cloudinary/uploadFilesCloudinary";
import passwordValidation from "@/lib/utils/passwordValidation";
import requestEmailConfirmation from "@/app/actions/auth/requestEmailConfirmation";
import { IUserPreferences } from "@/types/user";
import { roles } from "@/lib/constants";
import { getUsersService, createUserService } from "@/lib/services/users";

// @desc    Get all users
// @route   GET /users
// @access  Public
export const GET = async () => {
  try {
    const users = await getUsersService();

    if (!users || users.length === 0) {
      return NextResponse.json(
        { message: "No users found!" },
        { status: 404 }
      );
    }

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Get all users failed:", error);
    return NextResponse.json(
      {
        message: "Get all users failed!",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

// @desc    Create new user
// @route   POST /users
// @access  Public
export const POST = async (req: Request) => {
  try {
    // Parse FORM DATA instead of JSON because we might have an image file
    const formData = await req.formData();

    // Extract fields from formData
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const birthDate = formData.get("birthDate") as string;
    const imageFile = formData.get("imageFile") as File | undefined;

    // Preferences
    const language = formData.get("language") as string;
    const region = formData.get("region") as string;

    // Validate required fields
    if (
      !username ||
      !email ||
      !password ||
      !role ||
      !birthDate ||
      !language ||
      !region
    ) {
      return NextResponse.json(
        {
          message:
            "Username, email, password, role, birthDate, language and region are required!",
        },
        { status: 400 }
      );
    }

    // Validate password
    if (!passwordValidation(password)) {
      return NextResponse.json(
        {
          message:
            "Password must be at least 6 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol!",
        },
        { status: 400 }
      );
    }

    // Validate roles
    if (!roles.includes(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    // Create preferences object
    const preferences: IUserPreferences = {
      language,
      region,
    };

    // Generate userId first for potential image upload folder path
    const tempUserId = new mongoose.Types.ObjectId().toString();
    let imageUrl: string | undefined;
    let imageFileName: string | undefined;

    // Upload image to cloudinary if provided (before creating user)
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      const folder = `/users/${tempUserId}`;

      const cloudinaryUploadResponse = await uploadFilesCloudinary({
        folder,
        filesArr: [imageFile],
        onlyImages: true,
      });

      if (
        typeof cloudinaryUploadResponse === "string" ||
        cloudinaryUploadResponse.length === 0 ||
        !cloudinaryUploadResponse.every((str) => str.includes("https://")) ||
        !isValidUrl(cloudinaryUploadResponse[0])
      ) {
        return NextResponse.json(
          {
            message: `Error uploading image: ${cloudinaryUploadResponse}`,
          },
          { status: 400 }
        );
      }

      imageUrl = cloudinaryUploadResponse[0];
      imageFileName = imageFile.name;
    }

    // Create user using service
    try {
      await createUserService({
        username,
        email,
        password,
        role,
        birthDate,
        preferences,
        imageUrl,
        imageFile: imageFileName,
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";
      
      if (errorMessage.includes("already exists")) {
        return NextResponse.json(
          { message: "User with email already exists!" },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        {
          message: "Failed to create user and subscription",
          error: errorMessage,
        },
        { status: 500 }
      );
    }

    // Send email confirmation
    try {
      await requestEmailConfirmation(email);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail user creation if email fails, just log the error
    }

    return NextResponse.json(
      {
        message:
          "New user created successfully. Please check your email to confirm your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        message: "Create user failed!",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
};
