import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}

export async function uploadProfileImage(uid: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
    throw new Error("Choose a JPG, PNG or WebP image under 5 MB.");
  }
  try {
    if (!storage) throw new Error("Photo storage is unavailable right now.");
    const avatarRef = ref(storage, `profile-images/${uid}/avatar`);
    await withTimeout(uploadBytes(avatarRef, file, { contentType: file.type }), 20000, "Upload took too long. Check your connection and try again.");
    return await withTimeout(getDownloadURL(avatarRef), 20000, "Upload took too long. Check your connection and try again.");
  } catch (err: any) {
    const message = String(err?.message || "").toLowerCase();
    if (message.includes("permission") || message.includes("denied") || message.includes("unauthenticated") || message.includes("authorization")) {
      throw new Error("You don't have permission to upload a profile photo. Sign in and try again.");
    }
    return compactProfileImage(file);
  }
}

export async function compactProfileImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const value = new Image();
      value.onload = () => resolve(value);
      value.onerror = () => reject(new Error("The selected image could not be read."));
      value.src = objectUrl;
    });
    const maxSide = 512;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is not supported in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const encoded = canvas.toDataURL("image/jpeg", 0.76);
    if (encoded.length > 700_000) throw new Error("Please choose a simpler or smaller profile image.");
    return encoded;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}