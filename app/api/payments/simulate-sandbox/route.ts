import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  doc,
  runTransaction,
  collection,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { notify } from "@/lib/notifications";
import { MIN_BID } from "@/lib/tasks";

export async function POST(req: NextRequest) {
  try {
    // Prevent simulated funding in strict production unless explicitly enabled for staging/demo
    const isProduction = process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_SANDBOX !== "true";
    if (isProduction) {
      return NextResponse.json(
        {
          success: false,
          error: "Simulated sandbox funding is disabled in live production environment. Please complete payment via the regulated Safepay gateway.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { taskId, bidId, bidderId, bidderName, amount, posterId } = body;

    if (!taskId || !bidId || !bidderId || !amount || !posterId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters for sandbox funding." },
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

    const taskRef = doc(db, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);

    if (!taskSnap.exists()) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const task = taskSnap.data();

    // Verify requesting poster is the owner of the task
    if (task.posterId !== posterId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Only the task creator can fund escrow." },
        { status: 403 }
      );
    }

    if (task.status !== "open") {
      return NextResponse.json(
        { success: false, error: "Task is not currently open for offer selection." },
        { status: 400 }
      );
    }

    await runTransaction(db, async (transaction) => {
      const currentTask = await transaction.get(taskRef);
      if (!currentTask.exists()) throw new Error("Task not found.");
      if (currentTask.data().status !== "open") {
        throw new Error("Task status changed concurrently. Please refresh.");
      }

      transaction.update(taskRef, {
        status: "assigned",
        assignedTo: bidderId,
        assignedName: bidderName || "Assigned Freelancer",
        heldAmount: numericAmount,
        heldAt: serverTimestamp(),
        paymentRequested: false,
        paymentReleased: false,
        paymentGateway: "safepay_sandbox",
      });

      const bidRef = doc(db, "bids", bidId);
      transaction.update(bidRef, { status: "selected" });

      transaction.set(doc(collection(db, "wallet_txs")), {
        userId: task.posterId,
        amount: numericAmount,
        type: "hold",
        note: `Sandbox Escrow secured for ${task.title || taskId}`,
        createdAt: new Date().toISOString(),
        taskId,
        gateway: "safepay_sandbox",
      });
    });

    await notify({
      userId: bidderId,
      type: "selected",
      title: "Offer Funded & Task Assigned",
      body: `The client has secured the escrow funds for "${task.title || "your task"}". You may now begin work.`,
      link: `/tasks/${taskId}`,
    });

    return NextResponse.json({
      success: true,
      message: "Escrow successfully funded and assigned via sandbox protocol.",
    });
  } catch (error: any) {
    console.error("[Simulate Sandbox Funding Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process sandbox funding." },
      { status: 500 }
    );
  }
}
