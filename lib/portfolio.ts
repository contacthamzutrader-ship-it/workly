import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

export interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  skills: string[];
  imageUrl?: string;
  link?: string;
  createdAt?: any;
}

export async function uploadPortfolioImage(uid: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
    throw new Error("Choose a JPG, PNG or WebP image under 5 MB.");
  }
  if (!storage) throw new Error("Image storage is unavailable right now.");
  const imageRef = ref(storage, `portfolio-images/${uid}/${Date.now()}-${file.name}`);
  await uploadBytes(imageRef, file, { contentType: file.type });
  return await getDownloadURL(imageRef);
}