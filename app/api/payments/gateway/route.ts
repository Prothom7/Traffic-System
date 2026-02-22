import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConnection/dbConnection";
import { decodeJWTToken } from "@/helpers/jwtToken";
import Vehicle from "@/models/vehicleModel";
import TrafficRecord from "@/models/trafficRecordModel";

function normalizePlate(plate: string) {
  return plate.trim().toUpperCase();
}

function buildGatewayReference(recordId: string) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PAY-${recordId.slice(-6).toUpperCase()}-${Date.now()}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    await connect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = decodeJWTToken(token);

    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { recordId, paymentMethod } = body as {
      recordId?: string;
      paymentMethod?: string;
    };

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: "Ticket record id is required" },
        { status: 400 }
      );
    }

    const ticketRecord = await TrafficRecord.findById(recordId);
    if (!ticketRecord || !ticketRecord.violation) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    const ticketStatus = (ticketRecord.violation.status || "Pending").toLowerCase();
    if (ticketStatus === "paid" || ticketStatus === "resolved") {
      return NextResponse.json(
        { success: false, error: "Ticket is already settled" },
        { status: 409 }
      );
    }

    const ownerVehicle = await Vehicle.findOne({
      userId: decoded.id,
      number_plate: normalizePlate(ticketRecord.number_plate || ""),
    });

    if (!ownerVehicle) {
      return NextResponse.json(
        { success: false, error: "You can only pay your own ticket" },
        { status: 403 }
      );
    }

    const gatewayReference = buildGatewayReference(String(ticketRecord._id));
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const paidAt = new Date();

    const updateResult = await TrafficRecord.findByIdAndUpdate(
      recordId,
      {
        $set: {
          "violation.status": "Paid",
          "violation.payment_method": paymentMethod || "Card",
          "violation.payment_reference": gatewayReference,
          "violation.gateway_transaction_id": transactionId,
          "violation.gateway_status": "completed",
          "violation.paid_at": paidAt,
        },
      },
      { new: true }
    );

    if (!updateResult) {
      return NextResponse.json(
        { success: false, error: "Failed to update ticket status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment completed successfully",
      data: {
        ticketId: String(updateResult._id),
        status: updateResult.violation?.status || "Paid",
        fineAmount: updateResult.violation?.fine_amount || 0,
        paidAt,
        gatewayReference,
        transactionId,
      },
    });
  } catch (error: any) {
    console.error("Payment gateway error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Payment failed" },
      { status: 500 }
    );
  }
}
