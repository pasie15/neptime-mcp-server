import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "../constants.js";

let apiKey: string | undefined;

export function setApiKey(key: string): void {
  apiKey = key;
}

export function getApiKey(): string | undefined {
  return apiKey;
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

  const response = await axios({
    method,
    url: `${API_BASE_URL}/${endpoint}`,
    data,
    params,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-API-Key": apiKey
    }
  });
  return response.data;
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
          return "Error: Resource not found. Please check the ID is correct.";
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
