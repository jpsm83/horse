import { NextResponse } from "next/server";

// Centralized error handling
export const handleApiError = (especify: string, error: string) =>
  NextResponse.json({ Error: error }, { status: 500 });
