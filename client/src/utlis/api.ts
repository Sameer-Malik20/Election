// src/utils/api.ts
import { handleUnauthorized, getAccessToken } from "./auth";

const BASE_URL = "https://election-4j7k.onrender.com"; // Your backend URL

interface ApiOptions extends RequestInit {
  headers?: HeadersInit;
}

export const api = async <T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> => {
  const accessToken = getAccessToken();
  const headers = new Headers(options.headers);

  // Set default headers
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Add authorization if token exists
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    // Make API call with BASE_URL
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      const newToken = await handleUnauthorized();
      if (newToken) {
        // Retry with new token
        headers.set("Authorization", `Bearer ${newToken}`);
        const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: "include",
        });

        if (!retryResponse.ok) {
          throw new Error(await retryResponse.text());
        }
        return retryResponse.json();
      }
    }

    // Handle other errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || `Request failed with status ${response.status}`
      );
    }

    // Return successful response
    return response.json();
  } catch (error) {
    console.error("API call failed:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown API error occurred");
  }
};
