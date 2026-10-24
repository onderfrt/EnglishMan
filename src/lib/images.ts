import { useSyncExternalStore } from 'react';

/**
 * Kullanıcının kelimelere eklediği kendi görselleri (fotoğraf/çizim).
 * Kendi seçtiğin bir resim, hazır bir görselden çok daha güçlü bir hafıza bağı kurar.
 * Görseller küçültülüp (en fazla 320px, JPEG) tarayıcıda ayrı bir anahtarda saklanır.
 *
 * Cihazlar arası eşitleme için her kelimenin görselinin son eklenme/silinme zamanı da tutulur;
 * böylece bir cihazda silinen fotoğraf diğerinden geri gelmez.
 */
const KEY = 'englishman:images:v1';
const META_KEY = 'englishman:images:meta:v1';
const MAX_SIZE = 320;

export interface ImageMeta {
  /** Son değişiklik zamanı (ms). */
  at: number;
  removed?: true;
}

export interface ImageState {
  images: Record<string, string>;
  meta: Record<string, ImageMeta>;
}

let state: ImageState = { images: read(KEY), meta: read(META_KEY) };
const listeners = new Set<() => void>();

function read<T>(key: string): Record<string, T> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}');
  } catch {
    return {};
  }
}

function commit(next: ImageState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(next.images));
    localStorage.setItem(META_KEY, JSON.stringify(next.meta));
  } catch {
    return false; // Depolama dolu.
  }
  state = next;
  listeners.forEach((l) => l());
  return true;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useUserImage(wordId: string): string | undefined {
  return useSyncExternalStore(subscribe, () => state.images[wordId]);
}

/** Görseller değişince haber verir (eşitleme için). */
export const onImagesChange = subscribe;

export function removeUserImage(wordId: string): void {
  removeUserImages([wordId]);
}

/** Birden çok kelimenin görselini tek seferde siler (toplu silmede depolama yalnızca bir kez yazılır). */
export function removeUserImages(wordIds: string[]): void {
  const present = wordIds.filter((id) => id in state.images);
  if (!present.length) return;
  const images = { ...state.images };
  const meta = { ...state.meta };
  const at = Date.now();
  for (const id of present) {
    delete images[id];
    meta[id] = { at, removed: true };
  }
  commit({ images, meta });
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
    const ok = commit({
      images: { ...state.images, [wordId]: dataUrl },
      meta: { ...state.meta, [wordId]: { at: Date.now() } },
    });
    return ok ? null : 'Depolama alanı dolu; bazı görselleri kaldırmayı dene.';
  } catch {
    return 'Bu dosya açılamadı. Bir fotoğraf ya da resim seç.';
  }
}

/** Yedekleme için tüm kullanıcı görselleri. */
export function allUserImages(): Record<string, string> {
  return state.images;
}

/** Yedekten geri yükleme: mevcut görsellerle birleştirir. Başarısızsa (depolama dolu) false döner. */
export function mergeUserImages(incoming: Record<string, string>): boolean {
  const at = Date.now();
  const meta = { ...state.meta };
  for (const id of Object.keys(incoming)) meta[id] = { at };
  return commit({ images: { ...state.images, ...incoming }, meta });
}

export function getImageState(): ImageState {
  return state;
}

/** Eşitlemeden gelen birleştirilmiş durumu yazar. */
export function replaceImageState(next: ImageState): boolean {
  return commit(next);
}

/** Bu cihazdaki tüm görselleri siler (çıkışta "bu cihazdan da sil" seçilirse). */
export function clearImages(): void {
  commit({ images: {}, meta: {} });
}
