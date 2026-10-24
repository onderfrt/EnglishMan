/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase proje adresi, ör. https://abcd.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase "anon / publishable" anahtarı (herkese açık olabilir; veriyi satır düzeyi güvenlik korur). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Yalnızca testler: "mock" ise sahte eşitleme sunucusu kullanılır. */
  readonly VITE_BACKEND?: string;
  readonly VITE_MOCK_SYNC_URL?: string;
}
