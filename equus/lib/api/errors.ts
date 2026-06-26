/**
 * API error types and mapping — converts thrown errors into HTTP-safe `ApiError` instances.
 *
 * Used by `withRoute` in `lib/api/response.ts`. Zod and Mongoose validation errors
 * include a `fields` array so clients can show per-field messages on forms.
 */

import mongoose from "mongoose";
import { ZodError } from "zod";

export type ValidationFieldError = {
  path: string;
  message: string;
};

// --- ApiError ---

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fields?: ValidationFieldError[];

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    fields?: ValidationFieldError[],
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code ?? `HTTP_${statusCode}`;
    this.fields = fields;
  }
}

// --- Error mappers ---

/** Map a Mongoose document validation failure to a 400 with per-field messages. */
export function mapMongooseValidationError(
  error: mongoose.Error.ValidationError,
): ApiError {
  const fields = Object.values(error.errors).map((issue) => ({
    path: issue.path,
    message: issue.message,
  }));
  const message = fields.map((field) => field.message).join("; ") || "Validation failed";
  return new ApiError(400, message, "VALIDATION_ERROR", fields);
}

/** Normalize any thrown value into an `ApiError` for `fail()` responses. */
export function toHttpError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ZodError) {
    const fields = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    const message = fields.map((field) => field.message).join("; ") || "Invalid request";
    return new ApiError(400, message, "VALIDATION_ERROR", fields);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return mapMongooseValidationError(error);
  }

  if (error instanceof Error) {
    return new ApiError(500, error.message, "INTERNAL_ERROR");
  }

  return new ApiError(500, "An unexpected error occurred", "INTERNAL_ERROR");
}
