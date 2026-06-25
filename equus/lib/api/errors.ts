import { ZodError } from "zod";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code ?? `HTTP_${statusCode}`;
  }
}

export function toHttpError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join("; ") || "Invalid request";
    return new ApiError(400, message, "VALIDATION_ERROR");
  }

  if (error instanceof Error) {
    return new ApiError(500, error.message, "INTERNAL_ERROR");
  }

  return new ApiError(500, "An unexpected error occurred", "INTERNAL_ERROR");
}
