import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, runTransaction, collection, serverTimestamp } from "firebase/firestore";
import { notify } from "@/lib/notifications";

const MIN_WITHDRAWAL = 500;
const MAX_WITHDRAWAL = 500000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, amount, payoutMethod, accountTitle, accountNumber } = body;

    if (!userId || !amount || !payoutMethod || !accountTitle || !accountNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required withdrawal fields." },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount < MIN_WITHDRAWAL || numAmount > MAX_WITHDRAWAL) {
      return NextResponse.json(
        {
          success: false,
          error: `Withdrawal amount must be between PKR ${MIN_WITHDRAWAL.toLocaleString(
            "en-PK"
          )} and PKR ${MAX_WITHDRAWAL.toLocaleString("en-PK")}.`,
        },
        { status: 400 }
      );
    }

    if (!["raast", "bank", "jazzcash", "easypaisa"].includes(payoutMethod)) {
      return NextResponse.json(
        { success: false, error: "Invalid payout method selected." },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database service unavailable." },
        { status: 500 }
      );
    }

    const userRef = doc(db, "users", userId);

    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error("User account not found.");
      }

      const userData = userSnap.data();
      const currentBalance = userData.wallet ?? 0;

      if (currentBalance < numAmount) {
        throw new Error(
          `Insufficient available balance. You have PKR ${currentBalance.toLocaleString(
            "en-PK"
          )}, but requested PKR ${numAmount.toLocaleString("en-PK")}.`
        );
      }

      // Deduct available balance
      transaction.update(userRef, {
        wallet: currentBalance - numAmount,
        updatedAt: serverTimestamp(),
      });

      // Insert pending withdrawal transaction into ledger
      const txRef = doc(collection(db, "wallet_txs"));
      transaction.set(txRef, {
        userId,
        amount: numAmount,
        type: "withdraw",
        status: "pending",
        payoutMethod,
        accountTitle: accountTitle.trim(),
        accountNumber: accountNumber.trim(),
        note: `Withdrawal request to ${payoutMethod.toUpperCase()} (${accountNumber.trim()})`,
        createdAt: new Date().toISOString(),
      });
    });

    await notify({
      userId,
      type: "payout_requested",
      title: "Withdrawal Request Received",
      body: `Your payout request of PKR ${numAmount.toLocaleString(
        "en-PK"
      )} via ${payoutMethod.toUpperCase()} has been received and is being processed.`,
      link: "/wallet",
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully.",
      withdrawnAmount: numAmount,
    });
  } catch (error: any) {
    console.error("[Withdrawal Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process withdrawal." },
      { status: 400 }
    );
  }
}
