# Hesap ve cihazlar arası eşitleme: kurulum

Uygulama hesap özelliği için [Supabase](https://supabase.com) kullanır (giriş sistemi + veritabanı).
Supabase bağlanmadan uygulama eskisi gibi **hesapsız** çalışır; hesapla ilgili düğmeler görünmez.

Kurulum bir kez yapılır, yaklaşık 15 dakika sürer.

## 1. Supabase projesi oluştur

1. https://supabase.com adresinde ücretsiz hesap aç, **New project** de.
2. **Region:** `Central EU (Frankfurt)` seç (veriler Avrupa'da kalır; KVKK açısından tercih edilir).
3. Veritabanı şifresini güvenli bir yerde sakla (uygulama bunu kullanmaz).

## 2. Tabloyu oluştur

Supabase panelinde **SQL Editor → New query**, aşağıdakini yapıştırıp **Run** de:

```sql
-- Her kullanıcının verisi tek satırda: ilerleme ve kendi fotoğrafları.
create table public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  progress jsonb not null,
  images jsonb not null default '{"images": {}, "meta": {}}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Satır düzeyi güvenlik: herkes yalnızca kendi satırını görür ve değiştirir.
alter table public.user_data enable row level security;
create policy "kendi verimi oku"      on public.user_data for select using (auth.uid() = user_id);
create policy "kendi verimi ekle"     on public.user_data for insert with check (auth.uid() = user_id);
create policy "kendi verimi güncelle" on public.user_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kendi verimi sil"      on public.user_data for delete using (auth.uid() = user_id);

-- "Hesabımı sil" düğmesi: kullanıcı yalnızca kendi hesabını silebilir (verisi de otomatik silinir).
create or replace function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
```

## 3. Giriş ayarları

**Authentication → URL Configuration:**

- **Site URL:** `https://onderfrt.github.io/EnglishMan/`
- **Redirect URLs:** `https://onderfrt.github.io/EnglishMan/` ve (bilgisayarda geliştirme için) `http://localhost:5173/`

Bu adresler, e-posta doğrulama ve şifre sıfırlama bağlantılarının uygulamaya geri dönmesi için gerekir.

**Authentication → Sign In / Providers → Email:** açık olsun. "Confirm email" açıksa yeni kullanıcılar
e-postalarındaki bağlantıya tıklayarak hesaplarını doğrular (önerilir).

> **E-posta gönderim sınırı:** Supabase'in yerleşik e-posta servisi yalnızca deneme içindir ve saatte birkaç e-postayla
> sınırlıdır. Gerçek kullanıcılara açılmadan önce **Authentication → Emails → SMTP Settings** bölümünden bir e-posta
> servisi (ör. Resend, Brevo) bağlanmalı. Deneme aşamasında "Confirm email" geçici olarak kapatılabilir.

## 4. Anahtarları GitHub'a gir

Supabase panelinde **Project Settings → API** (ya da **Connect**) bölümünden iki değeri al:

- **Project URL** (ör. `https://abcdefgh.supabase.co`)
- **anon / publishable key** — tarayıcıda kullanılmak üzere tasarlanmış, herkese açık olabilen anahtar.
  Verileri yukarıdaki satır düzeyi güvenlik korur. ⚠️ `service_role` / `secret` anahtarını **asla** kullanma.

GitHub'da **EnglishMan → Settings → Secrets and variables → Actions → Variables** sekmesinde iki değişken ekle:

| Ad | Değer |
| --- | --- |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | anon / publishable key |

Sonra **Actions → Test & Deploy → Run workflow** ile yeniden yayınla. Ayarlar'da "☁️ Hesap" kartı görünür.

## 5. Bilgisayarda geliştirme (isteğe bağlı)

Proje klasöründe `.env.local` dosyası oluştur (git'e gönderilmez):

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## 6. Hatalı soru bildirimleri

Oturumda her sorunun altında **⚑ Hatalı soruyu bildir** bağlantısı var. Bildirimlerin sana ulaşması için Supabase'te
**SQL Editor → New query**'ye aşağıdakini yapıştırıp **Run**'a bas (bir kez yapman yeterli):

```sql
create table public.question_reports (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  word_id text not null,
  word text not null,
  mode text not null,
  reason text not null,
  note text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

alter table public.question_reports enable row level security;

-- Herkes (hesabı olmayanlar da) bildirim gönderebilir ama kimse başkasının bildirimini okuyamaz.
create policy "anyone can report" on public.question_reports
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
```

Bildirimleri **Table Editor → question_reports**'ta görürsün: hangi kelime, hangi soru tipi, sebep, kullanıcının
notu ve `details` sütununda sorunun gösterilen hâli (şıklar, doğru cevap, kullanıcının cevabı). Düzelttiğin
bildirimin `resolved` alanını `true` yapabilirsin.

- Tablo henüz yoksa ya da internet yoksa bildirimler cihazda bekler ve sonraki açılışta yeniden gönderilir.
- Kullanıcı yanlış cevapladığı bir soruyu bildirirse o yanlış tekrar planına işlenmez.

## Nasıl çalışır?

- Hesap açınca o cihazdaki ilerleme, kendi kelimeler ve fotoğraflar hesaba taşınır.
- Değişiklikler birkaç saniye içinde, uygulama arka plana alınınca ve internet geri gelince otomatik eşitlenir.
- İki cihazın verisi parça parça birleştirilir: her kelimede en son çalışılan kayıt, kendi kelimelerde en son düzenleme,
  ayarlarda en son değişiklik kazanır; silinen kelimeler başka cihazdan geri gelmez (`src/lib/sync/merge.ts`).
- Bir cihazda çıkış yapıp başka bir hesapla girilirse, önceki kişinin verileri yeni hesaba karışmaz.

## Yapılacaklar (yayından önce)

- [ ] KVKK aydınlatma metni ve gizlilik politikası (e-posta ve çalışma verisi işleniyor)
- [ ] Gerçek e-posta servisi (SMTP)
- [ ] İsteğe bağlı: Google ile giriş
