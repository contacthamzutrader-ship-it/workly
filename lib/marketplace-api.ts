import { auth } from "./firebase";

export type MarketplaceAction =
  | "create_task"
  | "update_task"
  | "place_bid"
  | "update_bid"
  | "withdraw_bid"
  | "select_bid"
  | "start_work"
  | "submit_work"
  | "request_changes"
  | "approve_delivery"
  | "cancel_task"
  | "open_dispute"
  | "set_task_status"
  | "approve_task"
  | "reject_task"
  | "claim_private_task"
  | "approve_private_task"
  | "add_review"
  | "create_conversation"
  | "send_message";

export async function marketplaceAction<T = Record<string, unknown>>(
  action: MarketplaceAction,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Sign in before performing this action.");

  const token = await user.getIdToken();
  const response = await fetch("/api/marketplace", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "That action could not be completed.");
  }

  if (action === "add_review" && typeof payload.taskId === "string") {
    await fetch("/api/trust/recalculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ taskId: payload.taskId }),
    }).catch(() => undefined);
  }

  return data as T;
}
