# EnglishMan — Gelir Planı (taslak)

> Bu belge yaşayan bir taslaktır. Her fazın sonunda gerçek verilerle güncellenir.
> Rakamlar (fiyat, maliyet) karar değil, test edilecek varsayımlardır.

## 1. Fikir ve konumlandırma

**Türkçe konuşanlar için, görsel çağrışım ve aralıklı tekrarla İngilizce kelime öğreten uygulama.**

Genel İngilizce pazarında Duolingo gibi dev rakipler var; onlarla aynı alanda yarışmak yerine
onların iyi yapmadığı bir alanı sahiplenmek gerekiyor. Güçlü adaylar:

| Niş | Neden umut verici | Risk |
| --- | --- | --- |
| **YDS / YÖKDİL / e-YDS** | Akademisyenler, kamu çalışanları (dil tazminatı), lisansüstü adayları için **kelime en büyük engel**; sınav kelime ağırlıklı ve para ödemeye istekli, net hedefi olan bir kitle. | Sınav dönemlerine bağlı dalgalı talep. |
| **IELTS / TOEFL** | Yurt dışı (eğitim/iş) hedefleyenler, yüksek ödeme isteği. | Uluslararası rakipler güçlü; Türkçe açıklama tek farkımız olur. |
| **Türklere özel İngilizce** | Türkçe'den kaynaklanan hatalar (false friends: *sympathetic ≠ sempatik*), telaffuz (th, w/v), Türkçe çağrışımlar. | Tek başına küçük; diğerleriyle birlikte güçlü bir fark. |

**Öneri:** Genel kelime uygulaması olarak büyümeye devam edip ilk ücretli paketi **YDS/YÖKDİL kelime paketi** yapmak.
"Türklere özel" yaklaşımı ise tüm ürünün ayırt edici özelliği olur.

## 2. Gelir modeli

**Freemium + abonelik** (eğitim uygulamalarında en yaygın ve en sürdürülebilir model).

| Ücretsiz | Premium |
| --- | --- |
| A1–B1 temel kelimeler | Tüm seviyeler (B2–C2) |
| Günlük sınırlı yeni kelime | Sınırsız yeni kelime |
| Temel soru tipleri | Sınav paketleri (YDS, YÖKDİL, IELTS) |
| Tek cihaz | Cihazlar arası senkronizasyon |
| | Yapay zekâ ile üretilmiş çağrışım görselleri |
| | Reading / Listening / Speaking modülleri |
| | Yapay zekâ ile telaffuz ve konuşma geri bildirimi |

- **Planlar:** aylık, yıllık (aylığa göre ~%40–50 indirimli) ve lansmana özel "erken destekçi" yıllık fiyatı.
  Kesin fiyatı rakip fiyatlarına bakarak ve test ederek belirleriz.
- **Reklam önerilmez:** öğrenme deneyimini bozar, Türkiye'de reklam geliri düşüktür.
  Gerekirse yalnızca ücretsiz sürümde "ödüllü reklam" (izle → ekstra kelime) denenebilir.
- **İleride B2B:** dershaneler, okullar ve şirketler için öğretmen paneli ve toplu lisans.

## 3. Teknik yol (bugünkü uygulamadan ücretli ürüne)

Bugün uygulama tamamen tarayıcıda çalışıyor ve veriler telefonda saklanıyor. Para kazanmak için gerekenler:

1. **Hesap ve bulut senkronizasyonu.** Ücretli kullanıcı verisini kaybedemez. Supabase ya da Firebase
   (giriş + veritabanı) küçük ölçekte ücretsiz/ucuzdur.
2. **Mağaza uygulamaları.** Mevcut React kodu **Capacitor** ile Android ve iOS uygulamasına dönüştürülür;
   kodu baştan yazmaya gerek yok. Önce Google Play (daha kolay ve ucuz), sonra App Store.
3. **Ödeme.** Mağaza içi abonelik için **RevenueCat** (Apple ve Google aboneliklerini tek yerden yönetir).
   Apple/Google küçük geliştiricilerden (yıllık 1 milyon $ altı) **%15** komisyon alır.
   Web'den satış için Türkiye'de **iyzico** ya da **PayTR** (Stripe Türkiye'deki şirketlere doğrudan hizmet vermiyor).
4. **Bildirimler.** Aralıklı tekrar ancak kullanıcı geri gelirse işe yarar; "Bugün 12 kelimen seni bekliyor"
   hatırlatması tutundurmanın (retention) en etkili aracıdır. Mağaza uygulamasında doğal bildirimler kullanılır.
5. **Ölçüm.** Gizliliğe saygılı analitik (ör. Plausible/Umami ya da PostHog): kaç kişi geri dönüyor,
   nerede bırakıyor, kaçı ödüyor.

## 4. Hukuki ve içerik konuları (atlanırsa sonradan pahalıya patlar)

- **Şirket:** Satış ve fatura için şahıs şirketi yeterli olabilir (bir mali müşavirle görüşülmeli).
  Genç girişimci vergi istisnası gibi destekler araştırılmalı.
- **KVKK:** Hesap açılınca kişisel veri işlenir → aydınlatma metni, gizlilik politikası, açık rıza.
- **Mağaza hesapları:** Apple Developer (yıllık 99 $), Google Play (tek seferlik 25 $).
- **İçerik lisansı:** Kelime listeleri ve örnek cümleler **bize ait olmalı.** Oxford 3000/5000 gibi listeler
  telif hakkıyla korunur; ticari üründe birebir kullanmadan önce lisans koşulları incelenmeli. Güvenli yol:
  açık lisanslı frekans verilerinden kendi listemizi oluşturmak ve cümleleri kendimiz yazmak (şu ankiler böyle).
- **Görseller:** Fluent Emoji (MIT) ticari kullanıma uygun; lisans notu uygulamada yer almalı.
  Yapay zekâ ile üretilecek görsellerde kullanılan servisin ticari kullanım şartları kontrol edilmeli.

## 5. Büyüme (müşteri bulma)

- **SEO — en güçlü fırsat:** Türkiye'de "*X ne demek*" aramaları çok yaygın. Her kelime için otomatik üretilen
  bir sayfa ("borrow ne demek? — görseli, telaffuzu, örnek cümlesi") hem trafik getirir hem uygulamaya yönlendirir.
  Veri zaten elimizde; bu sayfalar neredeyse bedavaya üretilir.
- **Kısa video içerik:** Görsel kelime kartları Instagram/TikTok'ta "günün kelimesi" ve
  "Türklerin en çok karıştırdığı kelimeler" gibi paylaşılabilir içeriklere dönüşür.
- **Sınav toplulukları:** YDS/YÖKDİL forumları, Telegram grupları, akademisyen toplulukları.
- **Arkadaşını davet et:** Davet edene ve edilene ücretsiz premium süre.

## 6. Fazlar

| Faz | Süre (tahmini) | Hedef | Çıktı |
| --- | --- | --- | --- |
| **0 — Doğrulama** | şimdi → 1 ay | Ürünü önce sen sev; talebi ölç | Kişisel kullanım geri bildirimleri, basit tanıtım sayfası + bekleme listesi, niş kararı |
| **1 — Pazara hazır MVP** | 1 → 3 ay | 20–50 kişilik beta, insanlar geri geliyor mu? | Hesap + senkronizasyon, 2000+ kelime, ilk sınav paketi, bildirimler, analitik |
| **2 — Para kazanma** | 3 → 5 ay | İlk ödeyen kullanıcılar | Google Play uygulaması, premium + RevenueCat, gizlilik/KVKK metinleri |
| **3 — Büyüme** | 5 ay → | Düzenli gelir | Kelime SEO sayfaları, video içerik, App Store, davet sistemi |
| **4 — Fark yaratan özellikler** | sürekli | Premium'u değerli kılmak | Reading, Listening, yapay zekâ ile Speaking ve telaffuz geri bildirimi |

## 7. Takip edilecek göstergeler

- **Tutunma (retention):** 1., 7. ve 30. günde geri dönen kullanıcı oranı. Bu iyi değilse ödeme ekranı işe yaramaz.
  İlk hedef: 7. gün için %20'nin üzeri.
- **Dönüşüm:** Ücretsizden ücretliye geçen oran (eğitim uygulamalarında genelde birkaç %).
- **Kayıp (churn):** Aboneliğini iptal edenlerin oranı.
- **Kullanıcı edinme maliyeti:** Reklam verirsek bir kullanıcının bize maliyeti; abonelikten kazandığımızdan düşük olmalı.

## 8. Kararlar

- [x] **İlk ücretli niş: YDS/YÖKDİL ve IELTS.** İkisinin ortak noktası **akademik kelime bilgisi**; bu yüzden ortak bir
  "Akademik Çekirdek" paketi üzerine sınava özel alıştırmalar kurulacak.
- [x] **Zaman: haftada 10 saat.** Kodlamayı Claude yapar; proje sahibinin saatleri ürün kararları, test, içerik kontrolü
  ve kullanıcılarla konuşmaya gider (bkz. bölüm 10).
- [ ] **Ad: "EnglishMan"** — ön kontrol yapıldı, resmi kontroller bekleniyor (bkz. bölüm 9).
- [ ] Başlangıç bütçesi (alan adı, mağaza hesapları, gerekirse marka başvurusu)
- [ ] Şirket kurma zamanı (ilk satıştan önce)

## 9. Ad: "EnglishMan" kullanılabilir mi?

**Ön araştırma (Ekim 2026):** Web aramalarında "EnglishMan" adlı bir İngilizce öğrenme uygulaması ya da Türkiye'de
bu adla bir kurs/marka bulunamadı. Bu, adın serbest olduğu anlamına gelmez; kesin sonuç resmi kontrollerle alınır.

**Bilinmesi gereken riskler:**
- "Englishman" sözlükte olan yaygın bir kelime (İngiliz adam). Bu tür adlar markalaşmada **ayırt edicilik**
  açısından zayıf kalabilir ve tescilde sorun çıkarabilir. Ayrıca aramalarda sözlük sonuçları ve Sting'in
  "Englishman in New York" şarkısı öne çıkar; uygulamayı adıyla bulmak zorlaşabilir.
- Çözüm önerisi: Mağazada adı anahtar kelimelerle birlikte kullanmak, ör. **"EnglishMan: YDS & IELTS Kelime"**.
  Hem marka korunur hem de arayan kitle uygulamayı bulur.

**Yapılacak kontroller:**
1. **TÜRKPATENT marka araştırması** (turkpatent.gov.tr, e-Devlet ile giriş): "englishman" ve benzer yazılışlar.
   Özellikle **41. sınıf** (eğitim hizmetleri) ve **9. sınıf** (yazılım/mobil uygulama) kayıtlarına bakılmalı.
2. **Mağazalar:** Google Play ve App Store'da "EnglishMan" araması (App Store aynı adda iki uygulamaya izin vermez).
3. **Alan adı:** englishman.app, englishman.com.tr, englishmanapp.com gibi seçeneklerin müsaitliği.
4. **Sosyal medya:** Instagram/TikTok/YouTube'da kullanıcı adının boş olup olmadığı.
5. Ciddi bir benzerlik çıkarsa ya da tescil başvurusu yapılacaksa bir **marka vekiline** danışmak
   (bu belge hukuki görüş değildir).

## 9b. Kullanıcı görüşmelerinden çıkan fark yaratan özellik

YDS/IELTS'e hazırlananlarla yapılan görüşmelerden sonra **kendi kelimelerini ekleme** özelliği eklendi (Ekim 2026):
tek tek ekleme/düzenleme (anlam, örnek cümle, eş anlamlı, kendi fotoğrafı) ve toplu içe aktarma (CSV, Excel,
Quizlet, Anki). Kullanıcı kendi kaynağındaki (deneme sınavı, kitap, dizi) kelimeleri aralıklı tekrar ve YDS tarzı
sorularla çalışabiliyor. **Premium adayı:** ücretsiz sürümde sınırlı sayıda (ör. 50) kendi kelime, premium'da sınırsız
ve cihazlar arası senkronizasyon.

**Anlamı otomatik doldurma (karar: önce sözlük, sonra yapay zekâ):**
- ✅ Ücretsiz katman: KeNet + WordNet'ten üretilmiş İngilizce→Türkçe öneri sözlüğü (~18.500 kelime). Maliyeti yok,
  internetsiz çalışır; eşleştirme otomatik olduğu için anlamlar tıklanabilir öneri olarak gösterilir.
- ⏳ Premium katman: yapay zekâ ile anlam + örnek cümle + çeviri. Bir sunucu (API anahtarı tarayıcıda tutulamaz),
  kullanıcı hesabı ve kullanım sınırı gerektirir; bu yüzden hesap/senkronizasyon (7–8. hafta) ile birlikte yapılır.

## 10. Faz 1 — Sınav odaklı MVP (yaklaşık 8–10 hafta)

**Hedef:** YDS/YÖKDİL ve IELTS hazırlananların her gün açmak isteyeceği bir kelime uygulaması ve 20–50 kişilik beta.

| Hafta | Ürün (Claude kodlar) | Proje sahibi (10 saat/hafta) |
| --- | --- | --- |
| 1–2 ✅ | Hedef seçimi (YDS / YÖKDİL / IELTS / Genel); **Akademik Çekirdek** paketinin ilk 150 kelimesi; kelimelere **eş anlamlılar** (YDS'de paraphrase bilgisi kritik) | Uygulamayı kullanmak; çevirileri ve örnek cümleleri kontrol etmek; ad kontrolleri (bölüm 9) |
| 3–4 ✅ | **YDS tarzı soru:** boşluklu cümle + A–E şıkları; eş anlamlı bulma sorusu; Akademik Çekirdek 300 kelime | YDS/IELTS'e hazırlanan **5–10 kişiyle konuşmak**: en çok neyi zor buluyorlar, ne için para ödüyorlar? |
| 5–6 | **IELTS konu paketleri** (çevre, eğitim, teknoloji, sağlık…) ve **collocation** soruları (ör. *make a decision*) | YDS/IELTS topluluklarını bulmak (Telegram, forumlar, Instagram); beta test kullanıcısı toplamak |
| 7–8 | **Hesap + bulut senkronizasyonu**, tanıtım sayfası + bekleme listesi, gizliliğe saygılı analitik | Tanıtım sayfası metinleri; beta davetleri |
| 9–10 | Günlük hatırlatma bildirimleri; beta geri bildirimlerine göre düzeltmeler | Betayı yürütmek; 7. gün tutunma oranına bakmak |

**İçerik ilkeleri:**
- Kelime listesi, eş anlamlılar ve örnek cümleler **bize ait** olacak. ÖSYM ve IELTS'in çıkmış soruları telif
  hakkıyla korunur; birebir kullanılmaz, kendi sınav tarzı sorularımızı yazarız.
- YÖKDİL alan farkı (Fen / Sağlık / Sosyal) ilk sürümde değil, sonraki paketlerde.

**Faz 1 sonunda bakılacak tek soru:** Beta kullanıcılarının en az %20'si 7. gün hâlâ çalışıyor mu?
Evetse Faz 2'ye (Google Play + premium), hayırsa ürünü düzeltmeye devam.
