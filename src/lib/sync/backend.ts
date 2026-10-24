import type { ImageState } from '../images';
import type { Progress } from '../storage';

export interface User {
  id: string;
  email: string;
}

/** Sunucuda saklanan kullanıcı verisi. */
export interface RemoteData {
  progress: Progress;
  images: ImageState;
}

export type AuthEvent = 'signed-in' | 'signed-out' | 'password-recovery';

/** Hesap ve eşitleme sunucusu. Gerçek uygulamada Supabase, testlerde sahte bir sunucu. */
export interface Backend {
  getUser(): Promise<User | null>;
  onAuthChange(cb: (event: AuthEvent, user: User | null) => void): () => void;
  /** Hesap oluşturur. E-posta doğrulaması gerekiyorsa `needsConfirmation` döner. */
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  load(userId: string): Promise<RemoteData | null>;
  /** images verilmezse sunucudaki görseller olduğu gibi kalır (her seferinde büyük veri gönderilmesin). */
  save(userId: string, progress: Progress, images?: ImageState): Promise<void>;
}

/** Kullanıcıya gösterilecek Türkçe hata mesajı. */
export class AuthError extends Error {}

/**
 * Yapılandırılmış sunucuyu döndürür; yapılandırma yoksa null (uygulama hesapsız, yalnızca bu cihazda çalışır).
 * Supabase kütüphanesi yalnızca gerektiğinde indirilir.
 */
export async function createBackend(): Promise<Backend | null> {
  if (import.meta.env.VITE_BACKEND === 'mock' && import.meta.env.VITE_MOCK_SYNC_URL) {
    const { mockBackend } = await import('./mockBackend');
    return mockBackend(import.meta.env.VITE_MOCK_SYNC_URL);
  }
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const { supabaseBackend } = await import('./supabaseBackend');
  return supabaseBackend(url, key);
}

export const accountsConfigured = (): boolean =>
  !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  !!(import.meta.env.VITE_BACKEND === 'mock' && import.meta.env.VITE_MOCK_SYNC_URL);
