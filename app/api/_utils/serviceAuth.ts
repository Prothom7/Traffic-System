import { NextRequest, NextResponse } from "next/server";
import { decodeJWTToken } from "@/helpers/jwtToken";
import User from "@/models/userModel";

export type AuthContext = {
  userId: string;
  isAdmin: boolean;
  user: any;
};

export async function getAuthContext(req: NextRequest): Promise<{ context?: AuthContext; error?: NextResponse }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  const token = authHeader.slice(7);
  const decoded = decodeJWTToken(token);
  if (!decoded?.id) {
    return {
      error: NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 }),
    };
  }

  const user = await User.findById(decoded.id).lean();
  if (!user) {
    return {
      error: NextResponse.json({ success: false, error: "User not found" }, { status: 404 }),
    };
  }

  return {
    context: {
      userId: String(user._id),
      isAdmin: Boolean(user.isAdmin),
      user,
    },
  };
}

export function mustBeAdmin(isAdmin: boolean) {
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  return null;
}
