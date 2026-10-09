import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { createSafepayTracker } from "@/lib/safepay";
import { MIN_BID } from "@/lib/tasks";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, bidId, bidderId, bidderName, amount, clientEmail } = body;

    if (!taskId || !bidId || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required checkout parameters (taskId, bidId, amount)." },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < MIN_BID) {
      return NextResponse.json(
        { success: false, error: `Minimum funding amount is PKR ${MIN_BID.toLocaleString("en-PK")}.` },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database service unavailable." },
        { status: 500 }
      );
    }

    const taskSnap = await getDoc(doc(db, "tasks", taskId));
    if (!taskSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    const taskData = taskSnap.data();
    if (taskData.status !== "open") {
      return NextResponse.json(
        { success: false, error: "This task is no longer open for funding." },
        { status: 400 }
      );
    }

    // Generate Safepay tracker session
    const trackerResult = await createSafepayTracker({
      amount: numericAmount,
      currency: "PKR",
      orderId: taskId,
      clientEmail: clientEmail || undefined,
    });

    return NextResponse.json({
      success: true,
      token: trackerResult.token,
      checkoutUrl: trackerResult.checkoutUrl,
      env: trackerResult.env,
      metadata: {
        taskId,
        bidId,
        bidderId,
        bidderName,
        amount: numericAmount,
      },
    });
  } catch (error: any) {
    console.error("[Create Safepay Checkout Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to initialize payment checkout." },
      { status: 500 }
    );
  }
}
