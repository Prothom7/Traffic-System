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
