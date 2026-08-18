import { auth } from "./firebase";

export async function syncPublicProfile(): Promise<void> {
  const user = auth?.currentUser;
  if (!user) return;
  const token = await user.getIdToken();
  const response = await fetch("/api/profile/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(typeof data?.error === "string" ? data.error : "Public profile could not be updated.");
  }
}
