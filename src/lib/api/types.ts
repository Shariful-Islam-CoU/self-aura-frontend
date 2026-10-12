// Backend envelope: every API response is wrapped in { success, message, data }.
// Validation failures are 400 responses with details: [{ path, message }].
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorResponse {
  message: string;
  details?: ApiErrorDetail[];
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ApiError extends Error {
  public status: number;
  public errors?: Record<string, string[]>;
  public details?: ApiErrorDetail[];
  public isApiError: boolean = true;

  constructor(message: string, status: number, errors?: Record<string, string[]>, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.details = details;
  }

  static fromResponse(response: Response, data: ApiErrorResponse): ApiError {
    // Normalize backend validation details into the per-field errors map so
    // forms can surface field-level messages.
    const errors: Record<string, string[]> = {};
    if (data.errors) {
      for (const [key, value] of Object.entries(data.errors)) {
        errors[key] = value;
      }
    }
    if (data.details) {
      for (const detail of data.details) {
        if (!detail || !detail.path || !detail.message) continue;
        if (!errors[detail.path]) errors[detail.path] = [];
        errors[detail.path].push(detail.message);
      }
    }
    return new ApiError(data.message || `API Error: ${response.status}`, response.status, errors, data.details);
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}