export interface JWTTokenPayload {
  id: string;
  email: string;
  type: "user" | "vehicle";
  name: string;
  iat?: number;
  exp?: number;
}

export function decodeJWTClient(token: string): JWTTokenPayload | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded as JWTTokenPayload;
  } catch (err) {
    console.error("Failed to decode JWT", err);
    return null;
  }
}

export function getValidAuthTokenClient(): string | null {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  const decoded = decodeJWTClient(token);
  const isExpired = typeof decoded?.exp === "number" && decoded.exp * 1000 <= Date.now();

  if (!decoded || isExpired) {
    localStorage.removeItem("authToken");
    return null;
  }

  return token;
}
