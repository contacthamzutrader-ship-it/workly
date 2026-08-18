import { auth } from "./firebase";

export type AdminAction =
  | "add_admin"
  | "update_admin"
  | "remove_admin"
  | "set_user_private"
  | "set_user_role"
  | "set_user_suspended"
  | "set_user_verified"
  | "save_settings"
  | "resolve_dispute"
  | "review_interview"
  | "sync_public_profiles";

export async function adminAction<T = Record<string, unknown>>(
  action: AdminAction,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Sign in with a staff account to continue.");
  const token = await user.getIdToken();
  const response = await fetch("/api/admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "The admin action could not be completed.");
  }
  return data as T;
}
