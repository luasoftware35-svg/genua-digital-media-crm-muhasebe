import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getClientStorage } from "./client";

const MAX_INLINE_DATA_URL_LENGTH = 800_000;

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function isFirebaseStorageEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FIREBASE_USE_STORAGE === "true";
}

/**
 * Storage kapalıyken (Spark plan) data URL'leri Firestore'da saklar.
 * Storage açılınca .env.local'e NEXT_PUBLIC_FIREBASE_USE_STORAGE=true ekleyin.
 */
export async function resolveStorageUrl(
  value: string | undefined,
  storagePath: string
): Promise<string | undefined> {
  if (!value) return undefined;
  if (!value.startsWith("data:")) return value;

  if (isFirebaseStorageEnabled()) {
    const storage = getClientStorage();
    const blob = dataUrlToBlob(value);
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, blob);
    return getDownloadURL(fileRef);
  }

  if (value.length > MAX_INLINE_DATA_URL_LENGTH) {
    throw new Error(
      "Dosya çok büyük (~600 KB üstü). Küçük bir görsel/dosya seç veya Firebase Storage'ı aç."
    );
  }

  return value;
}
