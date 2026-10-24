import { AuthError, type AuthEvent, type Backend, type User } from './backend';

/**
 * Yalnızca otomatik testler için sahte sunucu (VITE_BACKEND=mock). Gerçek uygulamaya dahil edilmez.
 * Küçük bir HTTP sunucusuyla konuşur; böylece iki ayrı tarayıcı "cihaz" aynı hesabı paylaşabilir.
 */
export function mockBackend(base: string): Backend {
  const KEY = 'englishman:mock-session';
  const listeners = new Set<(e: AuthEvent, u: User | null) => void>();
  const current = (): User | null => JSON.parse(localStorage.getItem(KEY) ?? 'null');
  const emit = (e: AuthEvent, u: User | null) => listeners.forEach((l) => setTimeout(() => l(e, u)));
  const call = async (path: string, body?: unknown) => {
    const r = await fetch(base + path, body === undefined ? undefined : { method: 'POST', body: JSON.stringify(body) });
    const json = await r.json();
    if (!r.ok) throw new AuthError(json.error);
    return json;
  };
  return {
    async getUser() {
      return current();
    },
    onAuthChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    async signUp(email, password) {
      const user = await call('/signup', { email, password });
      localStorage.setItem(KEY, JSON.stringify(user));
      emit('signed-in', user);
      return { needsConfirmation: false };
    },
    async signIn(email, password) {
      const user = await call('/signin', { email, password });
      localStorage.setItem(KEY, JSON.stringify(user));
      emit('signed-in', user);
    },
    async sendPasswordReset() {},
    async updatePassword() {},
    async signOut() {
      localStorage.removeItem(KEY);
      emit('signed-out', null);
    },
    async deleteAccount() {
      await call('/delete', { id: current()?.id });
      localStorage.removeItem(KEY);
      emit('signed-out', null);
    },
    async load(userId) {
      return (await call(`/data?user=${userId}`)).data;
    },
    async save(userId, progress, images) {
      await call('/data', { userId, progress, images });
    },
  };
}
