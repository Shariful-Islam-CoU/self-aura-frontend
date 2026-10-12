import { appConfig } from "@/lib/config";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  ApiError,
  ApiErrorResponse,
  PaginatedResponse,
  RequestOptions,
} from "./types";

class ApiClient {
  private baseUrl: string;

  // Global handler invoked when any request fails with 401 (expired/invalid
  // token). Registered by AuthProvider so the app can clear auth and redirect.
  private static unauthorizedHandler: (() => void) | null = null;

  static setUnauthorizedHandler(handler: (() => void) | null): void {
    ApiClient.unauthorizedHandler = handler;
  }

  constructor(baseUrl: string = appConfig.apiUrl) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, headers, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...this.getAuthHeaders(),
        ...headers,
      },
      // Auth is a Bearer token in the Authorization header (no cookies), so
      // do NOT request credentials cross-origin: `include` would force the
      // preflight to require `Access-Control-Allow-Credentials: true`, which
      // the API server does not send, blocking every request. `same-origin`
      // (the fetch default) keeps credentialed behavior for same-origin calls
      // while making cross-origin calls credential-less.
      credentials: "same-origin",
    });

    if (!response.ok) {
      let errorData: ApiErrorResponse = { message: `API Error: ${response.status}` };
      try {
        errorData = await response.json();
      } catch {
        // Ignore JSON parse error
      }
      if (response.status === 401) {
        ApiClient.unauthorizedHandler?.();
      }
      throw ApiError.fromResponse(response, errorData);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  // Helper for paginated responses
  async getPaginated<T>(endpoint: string, options?: RequestOptions): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(endpoint, options);
  }

  /**
   * Multipart upload with real progress reporting.
   *
   * `fetch` still has no portable upload-progress event, and a product video is
   * up to 100 MB - a spinner with no progress is indistinguishable from a hung
   * request. `XMLHttpRequest.upload.onprogress` is the only browser API that
   * reports bytes sent, so it is the one transport used for file bodies.
   *
   * `Content-Type` is deliberately NOT set: the browser has to add the multipart
   * boundary itself, and forcing a content type is the classic way to corrupt an
   * upload. The multipart text fields are bounded server-side, so nothing sent
   * from here is unbounded client input.
   */
  upload<T>(
    endpoint: string,
    formData: FormData,
    options: {
      params?: Record<string, string | number | boolean | undefined>;
      onProgress?: (percent: number) => void;
      signal?: AbortSignal;
    } = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const token = getAuthToken();

    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.withCredentials = false;
      xhr.setRequestHeader("Accept", "application/json");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (!options.onProgress || !event.lengthComputable || event.total === 0) return;
        // Rounded to whole percent: a bar that repaints on every progress event
        // is a performance problem, not a feature.
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      };

      xhr.onload = () => {
        let payload: { message?: string } | null = null;
        try {
          payload = JSON.parse(xhr.responseText) as { message?: string };
        } catch {
          // A non-JSON body means a proxy or the server itself failed; the
          // status branch below still produces a usable error.
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload as T);
          return;
        }

        if (xhr.status === 401) {
          ApiClient.unauthorizedHandler?.();
        }

        // The message comes from the application's own envelope, so a validation
        // failure or a clean provider error reaches the user verbatim instead of
        // being replaced by a generic "upload failed".
        reject(
          new ApiError(
            payload?.message || `Upload failed (${xhr.status})`,
            xhr.status,
            undefined,
            undefined
          )
        );
      };

      xhr.onerror = () => {
        // A network-level failure carries no status and no server message.
        reject(new ApiError("Upload failed. Check your connection and try again.", 0));
      };

      xhr.onabort = () => {
        reject(new ApiError("Upload cancelled.", 0));
      };

      options.signal?.addEventListener("abort", () => xhr.abort(), { once: true });

      xhr.send(formData);
    });
  }
}

export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export { ApiClient };