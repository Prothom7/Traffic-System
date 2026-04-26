import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Deprecated endpoint. Use /api/payments/initiate and /api/payments/verify.",
    },
    { status: 410 }
  );
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Deprecated endpoint. Use /api/payments/initiate and /api/payments/verify.",
    },
    { status: 410 }
  );
}
