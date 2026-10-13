import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  doc,
  runTransaction,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { verifySafepayWebhookSignature } from "@/lib/safepay";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-sfpy-signature") ||
      req.headers.get("x-signature") ||
      null;

    // Enforce cryptographic HMAC verification
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction && !process.env.SAFEPAY_WEBHOOK_SECRET) {
      console.error("[Safepay Webhook] Critical: SAFEPAY_WEBHOOK_SECRET not configured in production.");
      return NextResponse.json(
        { success: false, error: "Webhook endpoint not configured." },
        { status: 500 }
      );
    }

    if (process.env.SAFEPAY_WEBHOOK_SECRET || isProduction) {
      const isValid = verifySafepayWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error("[Safepay Webhook] Invalid or missing webhook signature.");
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature." },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody || "{}");
    const event = payload?.event || payload?.type || "payment.completed";
    const data = payload?.data || payload;

    const orderId =
      data?.order_id ||
      data?.metadata?.taskId ||
      data?.token ||
      data?.tracker?.order_id;
    const amount = Number(data?.amount || data?.tracker?.amount || 0);
    const bidderId = data?.metadata?.bidderId || data?.bidderId;
    const bidderName = data?.metadata?.bidderName || data?.bidderName || "Assigned Freelancer";
    const bidId = data?.metadata?.bidId || data?.bidId;

    // Log webhook payload durably in Firestore
    if (db) {
      await addDoc(collection(db, "webhook_logs"), {
        provider: "safepay",
        event,
        orderId: orderId || null,
        amount,
        rawPayload: payload,
        createdAt: serverTimestamp(),
      });
    }

    // Process payment completion
    if (orderId && db && (event === "payment.completed" || event === "order.paid")) {
      const taskRef = doc(db, "tasks", orderId);

      await runTransaction(db, async (transaction) => {
        const taskSnap = await transaction.get(taskRef);
        if (!taskSnap.exists()) {
          console.warn(`[Safepay Webhook] Task ${orderId} not found.`);
          return;
        }

        const task = taskSnap.data();
        if (task.status === "assigned" && task.heldAmount) {
          // Already processed, idempotent return
          return;
        }

        const updateData: Record<string, any> = {
          status: "assigned",
          heldAmount: amount || task.budget || 0,
          heldAt: serverTimestamp(),
          paymentRequested: false,
          paymentReleased: false,
          paymentGateway: "safepay",
        };

        if (bidderId) {
          updateData.assignedTo = bidderId;
          updateData.assignedName = bidderName;
        }

        transaction.update(taskRef, updateData);

        if (bidId) {
          transaction.update(doc(db, "bids", bidId), { status: "selected" });
        }

        // Write immutable ledger entry
        transaction.set(doc(collection(db, "wallet_txs")), {
          userId: task.posterId,
          amount: amount || task.budget || 0,
          type: "hold",
          note: `Safepay Escrow funded for ${task.title}`,
          createdAt: new Date().toISOString(),
          taskId: orderId,
          gateway: "safepay",
        });
      });

      if (bidderId) {
        await notify({
          userId: bidderId,
          type: "selected",
          title: "Offer Funded & Assigned via Safepay",
          body: `The client has secured the escrow funds for this project. You may now begin work.`,
          link: `/tasks/${orderId}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      received: true,
      message: "Safepay event processed successfully.",
    });
  } catch (error: any) {
    console.error("[Safepay Webhook Exception]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal webhook error." },
      { status: 500 }
    );
  }
}
