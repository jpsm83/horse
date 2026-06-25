import { NextResponse } from "next/server";
import { ApiError, toHttpError } from "./errors.ts";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(error: ApiError) {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
      },
    },
    { status: error.statusCode },
  );
}

export async function withRoute(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return fail(toHttpError(error));
  }
}
