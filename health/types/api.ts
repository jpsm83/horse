// Generic API response interface for all services
export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// Paginated response interface
export interface IPaginatedResponse<T> {
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  data: T[];
}

// generic mongo filter interface
export interface IMongoFilter {
  [key: string]: unknown;
}
