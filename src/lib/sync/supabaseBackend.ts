import { createClient } from '@supabase/supabase-js';
import { AuthError, type AuthEvent, type Backend, type RemoteData, type User } from './backend';

/**
 * Supabase ile hesap + eşitleme. Veritabanı kurulumu için docs/hesap-kurulumu.md'ye bakın.
 * Tablo: user_data (user_id, progress, images, updated_at); her kullanıcı yalnızca kendi satırını görür (RLS).
 */
export function supabaseBackend(url: string, key: string): Backend {
  const client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  // E-posta doğrulama ve şifre sıfırlama bağlantıları uygulamanın kendi adresine döner.
  const redirectTo = () => window.location.origin + window.location.pathname;
  const toUser = (u: { id: string; email?: string } | null | undefined): User | null =>
    u ? { id: u.id, email: u.email ?? '' } : null;

  const fail = (error: { message?: string; code?: string; status?: number } | null) => {
    if (error) throw new AuthError(turkishMessage(error));
  };

  return {
    async getUser() {
      const { data } = await client.auth.getSession();
      return toUser(data.session?.user);
    },
    onAuthChange(cb) {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        const map: Partial<Record<string, AuthEvent>> = {
          SIGNED_IN: 'signed-in',
          SIGNED_OUT: 'signed-out',
          PASSWORD_RECOVERY: 'password-recovery',
        };
        const e = map[event];
        if (e) setTimeout(() => cb(e, toUser(session?.user))); // Supabase geri çağrısında başka istek yapılmamalı
      });
      return () => data.subscription.unsubscribe();
    },
    async signUp(email, password) {
      const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
      fail(error);
      // E-posta doğrulaması açıkken var olan bir adresle kayıt, hata yerine kimliği boş bir kullanıcı döndürür.
      if (data.user && data.user.identities?.length === 0) throw new AuthError('Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.');
      return { needsConfirmation: !data.session };
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      fail(error);
    },
    async sendPasswordReset(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
      fail(error);
    },
    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password });
      fail(error);
    },
    async signOut() {
      await client.auth.signOut();
    },
    async deleteAccount() {
      const { error } = await client.rpc('delete_my_account');
      fail(error);
      await client.auth.signOut();
    },
    async load(userId) {
      const { data, error } = await client.from('user_data').select('progress, images').eq('user_id', userId).maybeSingle();
      fail(error);
      return (data as RemoteData | null) ?? null;
    },
    async save(userId, progress, images) {
      const row: Record<string, unknown> = { user_id: userId, progress, updated_at: new Date().toISOString() };
      if (images) row.images = images;
      const { error } = await client.from('user_data').upsert(row);
      fail(error);
    },
  };
}

function turkishMessage(error: { message?: string; code?: string; status?: number }): string {
  const code = error.code ?? '';
  const msg = error.message ?? '';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) return 'E-posta ya da şifre hatalı.';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg))
    return 'E-posta adresin henüz doğrulanmadı. Gelen kutundaki bağlantıya tıkla (gereksiz klasörüne de bak).';
  if (code === 'user_already_exists' || /already registered/i.test(msg)) return 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.';
  if (code === 'weak_password' || /password should be/i.test(msg)) return 'Şifre en az 6 karakter olmalı.';
  if (code === 'validation_failed' || /invalid.*email|unable to validate email/i.test(msg)) return 'Geçerli bir e-posta adresi yaz.';
  if (/rate limit|only request this after/i.test(msg) || error.status === 429)
    return 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
  if (/fetch|network/i.test(msg)) return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.';
  return `Bir sorun oluştu: ${msg || code || 'bilinmeyen hata'}`;
}
