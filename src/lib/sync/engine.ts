import { useSyncExternalStore } from 'react';
import { clearImages, getImageState, onImagesChange, replaceImageState } from '../images';
import { emptyProgress, type Progress } from '../storage';
import { AuthError, createBackend, type Backend, type User } from './backend';
import { mergeImages, mergeProgress, sameJSON } from './merge';

/**
 * Hesap ve cihazlar arası eşitleme.
 * - Girişte: sunucudaki veri bu cihazdakiyle birleştirilir (merge.ts), sonuç iki tarafa da yazılır.
 * - Değişiklikten birkaç saniye sonra, uygulama arka plana alınınca ve internet geri gelince otomatik eşitlenir.
 * - Hesapsız kullanım aynen sürer; hesap yalnızca isteğe bağlıdır.
 */
export type SyncStatus = 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncState {
  /** Sunucu yapılandırılmış mı (değilse hesap özellikleri gizlenir). */
  configured: boolean;
  ready: boolean;
  user: User | null;
  status: SyncStatus;
  lastSync: number | null;
  error: string | null;
  /** Şifre sıfırlama bağlantısıyla gelindi: yeni şifre istenmeli. */
  recovery: boolean;
}

interface Host {
  getLocal: () => Progress;
  /** Birleştirmeyi React durumuna uygular (değişiklik yoksa aynı nesneyi döndürmeli). */
  applyLocal: (fn: (p: Progress) => Progress) => void;
}

/** Bu cihazdaki verinin hangi hesaba ait olduğu (başka hesapla girilirse veriler karışmasın). */
const OWNER_KEY = 'englishman:owner';
const DEBOUNCE_MS = 2500;

let backend: Backend | null = null;
let host: Host | null = null;
let state: SyncState = { configured: false, ready: false, user: null, status: 'signed-out', lastSync: null, error: null, recovery: false };
const listeners = new Set<() => void>();
let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useSync(): SyncState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export async function initSync(h: Host): Promise<void> {
  host = h;
  backend = await createBackend();
  if (!backend) return set({ configured: false, ready: true });

  backend.onAuthChange((event, user) => {
    if (event === 'password-recovery') set({ recovery: true });
    if (event === 'signed-in' && user) void handleSignedIn(user);
    if (event === 'signed-out') set({ user: null, status: 'signed-out' });
  });
  const user = await backend.getUser();
  set({ configured: true, ready: true });
  if (user) await handleSignedIn(user);

  onImagesChange(scheduleSync);
  document.addEventListener('visibilitychange', () => {
    // Arka plana alınırken bekleyen değişiklikleri hemen gönder; öne gelince diğer cihazdakileri çek.
    if (document.visibilityState === 'hidden' && timer) flush();
    if (document.visibilityState === 'visible') void syncNow();
  });
  window.addEventListener('online', () => void syncNow());
}

async function handleSignedIn(user: User) {
  if (state.user?.id === user.id) return; // aynı oturum için tekrarlanan olay
  const owner = localStorage.getItem(OWNER_KEY);
  // Bu cihazdaki veriler başka bir hesaba aitse bu hesaba karıştırma: önce temizle, sonra hesabınkini indir.
  if (owner && owner !== user.id) {
    host?.applyLocal(() => emptyProgress());
    clearImages();
  }
  localStorage.setItem(OWNER_KEY, user.id);
  set({ user, status: 'syncing', error: null });
  await syncNow();
}

/** Yerel değişiklikten sonra çağrılır: birkaç saniye bekleyip eşitler (art arda değişiklikler tek seferde gider). */
export function scheduleSync(): void {
  if (!state.user) return;
  clearTimeout(timer);
  timer = setTimeout(flush, DEBOUNCE_MS);
}

function flush() {
  clearTimeout(timer);
  timer = undefined;
  void syncNow();
}

export function syncNow(): Promise<void> {
  if (!backend || !host || !state.user) return Promise.resolve();
  if (running) {
    again = true;
    return running;
  }
  const { id } = state.user;
  running = (async () => {
    set({ status: 'syncing' });
    try {
      const remote = await backend!.load(id);
      if (state.user?.id !== id) return;
      // Birleştir: bu cihaza uygula, sonucu sunucuya yaz (değişiklik yoksa yazma).
      const merged = mergeProgress(host!.getLocal(), remote?.progress);
      host!.applyLocal((p) => mergeProgress(p, remote?.progress));
      const images = mergeImages(getImageState(), remote?.images);
      if (!sameJSON(images, getImageState())) replaceImageState(images);
      const imagesChanged = !remote || !sameJSON(images, remote.images);
      if (!remote || imagesChanged || !sameJSON(merged, remote.progress)) {
        await backend!.save(id, merged, imagesChanged ? images : undefined);
      }
      set({ status: 'synced', lastSync: Date.now(), error: null });
    } catch (e) {
      set({ status: navigator.onLine ? 'error' : 'offline', error: e instanceof Error ? e.message : String(e) });
    } finally {
      running = null;
      if (again) {
        again = false;
        void syncNow();
      }
    }
  })();
  return running;
}

// ---------- Hesap işlemleri (arayüzden çağrılır) ----------

function need(): Backend {
  if (!backend) throw new AuthError('Hesap özelliği bu sürümde etkin değil.');
  return backend;
}

export const signUp = (email: string, password: string) => need().signUp(email.trim(), password);
export const signIn = (email: string, password: string) => need().signIn(email.trim(), password);
export const sendPasswordReset = (email: string) => need().sendPasswordReset(email.trim());

export async function updatePassword(password: string) {
  await need().updatePassword(password);
  set({ recovery: false });
}

export function dismissRecovery() {
  set({ recovery: false });
}

/** Çıkış: önce son değişiklikler gönderilir. `clearDevice` ise bu cihazdaki veriler de silinir. */
export async function signOut(clearDevice: boolean) {
  clearTimeout(timer);
  await syncNow();
  await need().signOut();
  set({ user: null, status: 'signed-out', lastSync: null });
  if (clearDevice) {
    host?.applyLocal(() => emptyProgress());
    clearImages();
    localStorage.removeItem(OWNER_KEY);
  }
}

/** Hesabı ve sunucudaki tüm verileri siler; bu cihazdaki veriler hesapsız kullanım için kalır. */
export async function deleteAccount() {
  clearTimeout(timer);
  await need().deleteAccount();
  localStorage.removeItem(OWNER_KEY);
  set({ user: null, status: 'signed-out', lastSync: null });
}
