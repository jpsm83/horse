export class ApiClientError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly fields?: Record<string, string>;

  constructor(
    statusCode: number,
    message: string,
    code: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

type ApiSuccess<T> = { data: T };
type ApiErrorBody = {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
};

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiSuccess<T> | ApiErrorBody;

  if (!response.ok) {
    const message =
      "error" in body && body.error?.message
        ? body.error.message
        : "Request failed";
    const code =
      "error" in body && body.error?.code
        ? body.error.code
        : `HTTP_${response.status}`;
    const fields = "error" in body ? body.error?.fields : undefined;
    throw new ApiClientError(response.status, message, code, fields);
  }

  return (body as ApiSuccess<T>).data;
}
