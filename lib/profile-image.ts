import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadProfileImage(uid: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
    throw new Error("Choose a JPG, PNG or WebP image under 5 MB.");
  }
  try {
    if (!storage) throw new Error("Storage unavailable");
    const avatarRef = ref(storage, `profile-images/${uid}/avatar`);
    await uploadBytes(avatarRef, file, { contentType: file.type });
    return await getDownloadURL(avatarRef);
  } catch {
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