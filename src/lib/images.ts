import { useSyncExternalStore } from 'react';

/**
 * Kullanıcının kelimelere eklediği kendi görselleri (fotoğraf/çizim).
 * Kendi seçtiğin bir resim, hazır bir görselden çok daha güçlü bir hafıza bağı kurar.
 * Görseller küçültülüp (en fazla 320px, JPEG) tarayıcıda ayrı bir anahtarda saklanır.
 */
const KEY = 'englishman:images:v1';
const MAX_SIZE = 320;

let images: Record<string, string> = load();
const listeners = new Set<() => void>();

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

function commit(next: Record<string, string>): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return false; // Depolama dolu.
  }
  images = next;
  listeners.forEach((l) => l());
  return true;
}

export function useUserImage(wordId: string): string | undefined {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => images[wordId],
  );
}

export function removeUserImage(wordId: string): void {
  const next = { ...images };
  delete next[wordId];
  commit(next);
}

/** Dosyayı kare olarak kırpar, küçültür ve kaydeder. Başarısızsa hata mesajı döner. */
export async function setUserImage(wordId: string, file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const size = Math.min(MAX_SIZE, side);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    canvas.getContext('2d')!.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    return commit({ ...images, [wordId]: dataUrl }) ? null : 'Depolama alanı dolu; bazı görselleri kaldırmayı dene.';
  } catch {
    return 'Bu dosya açılamadı. Bir fotoğraf ya da resim seç.';
  }
}
