import { jwtDecode } from "jwt-decode";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: "employee" | "admin";
}

interface DecodedToken {
  exp: number; // JWT expiry timestamp
}

const BASE_URL = "https://election-4j7k.onrender.com";

// Save token and set auto logout timer
export const setAuthTokens = (
  accessToken: string,
  userData: UserData
): void => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("user", JSON.stringify(userData));

  // Decode token expiry
  try {
    const decoded: DecodedToken = jwtDecode(accessToken);
    const expiryTime = decoded.exp * 1000 - Date.now();

    if (expiryTime > 0) {
      // Auto logout after expiry
      setTimeout(() => {
        clearAuthTokens();
        window.location.href = "/login";
      }, expiryTime);
    }
  } catch (err) {
    console.error("Token decoding failed", err);
  }
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const getUser = (): UserData | null => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
};

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.exp * 1000 > Date.now(); // Expiry Check
  } catch {
    return false;
  }
};

export const handleUnauthorized = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      setAuthTokens(data.accessToken, data.user);
      return data.accessToken;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
  }

  clearAuthTokens();
  window.location.href = "/login";
  return null;
};
