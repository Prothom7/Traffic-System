import { NextRequest, NextResponse } from "next/server";
import { decodeJWTToken } from "@/helpers/jwtToken";
import { eventBus } from "@/app/api/notifications/eventBus";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = decodeJWTToken(token);
  if (!decoded?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: any) => {
        if (String(payload?.userId) !== String(decoded.id)) return;
        controller.enqueue(
          encoder.encode(`event: traffic-record-created\ndata: ${JSON.stringify(payload)}\n\n`)
        );
      };

      const ping = setInterval(() => {
        controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
      }, 25000);

      controller.enqueue(encoder.encode(": connected\n\n"));
      eventBus.on("traffic-record-created", send);

      cleanup = () => {
        clearInterval(ping);
        eventBus.off("traffic-record-created", send);
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
