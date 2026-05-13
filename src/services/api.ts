import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "../constants.js";

let apiKey: string | undefined;

export function setApiKey(key: string): void {
  apiKey = key;
}

export function getApiKey(): string | undefined {
  return apiKey;
}

export function prepareRequestBody(data?: unknown): { data: unknown; contentType?: string } {
  if (data === undefined || data === null) return { data };
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    return { data };
  }
  if (typeof data === "object") {
    return { data, contentType: "application/json" };
  }
  return { data };
}

export function assertSuccessfulApiResponse<T>(data: T): T {
  if (data && typeof data === "object" && "success" in data && data.success === false) {
    const error = (data as { error?: { code?: string; message?: string } }).error;
    const code = error?.code ? `${error.code}: ` : "";
    throw new Error(`${code}${error?.message || "Neptime API returned success=false"}`);
  }
  return data;
}

export async function makeApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  if (!apiKey) {
    throw new Error("API key not configured. Set NEPTIME_API_KEY environment variable.");
  }

  // Add api_key to params (API expects it as query parameter)
  const requestParams = {
    ...params,
    api_key: apiKey
  };

  const prepared = prepareRequestBody(data);
  const headers: Record<string, string> = {
    "Accept": "application/json"
  };
  if (prepared.contentType) headers["Content-Type"] = prepared.contentType;

  const response = await axios({
    method,
    url: `${API_BASE_URL}/${endpoint}`,
    data: prepared.data,
    params: requestParams,
    timeout: 30000,
    headers
  });
  return assertSuccessfulApiResponse(response.data);
}

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return `Error: Bad request - ${data?.error?.message || "Invalid input"}`;
        case 401:
          return "Error: Invalid API key. Check your NEPTIME_API_KEY.";
        case 403:
          return "Error: Permission denied. Your API key doesn't have access to this resource.";
        case 404:
          return `Error: ${data?.error?.code || "Resource not found"} - ${data?.error?.message || "Please check the ID is correct."}`;
        case 429:
          return "Error: Rate limit exceeded. Please wait before making more requests.";
        default:
          return `Error: API request failed with status ${status} - ${data?.error?.message || "Unknown error"}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "Error: Request timed out. Please try again.";
    } else if (error.code === "ENOTFOUND") {
      return "Error: Could not connect to Neptime API. Check your network connection.";
    }
  }
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}
