// File: helpers/jwtToken.ts
import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "your_super_secret_key";

export interface JWTTokenPayload {
  id: string;
  email: string;
  type: "user" | "vehicle";
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token safely
 */
export function signToken(
  payload: JWTTokenPayload,
  expiresIn: string = "1h" // can be "1h", "24h", "7d", etc.
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as any, // cast to any to satisfy TS
  };
  return jwt.sign(payload as object, JWT_SECRET, options);
}

/**
 * Decode a JWT token safely
 */
export function decodeJWTToken(token: string): JWTTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTTokenPayload;
  } catch (err) {
    console.error("Invalid JWT token:", err);
    return null;
  }
}
