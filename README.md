# EnglishMan 🇬🇧

İngilizceyi öğrenirken birlikte geliştirdiğimiz, kendi kendine test edilen bir öğrenme uygulaması.
İlk modül: **kelime öğrenimi**. 529 kelime: A1'den C2'ye 6 seviye ve sınavlar için **Akademik Çekirdek** paketi.

## Hedefler ve seviyeler

İlk açılışta hedefini seçersin: **YDS**, **YÖKDİL**, **IELTS** ya da **Genel İngilizce**.

- **Sınav hedefleri:** Yeni kelimeler Akademik Çekirdek paketinden (302 kelime, B1→C2 sırasıyla) gelir. Her kelimenin
  eş anlamlıları da gösterilir. *although, whereas, despite* gibi bağlaçlar ve edatlar da pakete dahildir.
  Sınav tarihini girersen ana sayfada kalan gün ve paketi bitirmek için günde kaç yeni kelime gerektiği görünür.
- **Genel İngilizce:** Seviyeni seçersin ya da 2 dakikalık seviye testini yaparsın. Testte her seviyeden 5 kelime sorulur,
4 ve üzeri doğru yaparsan bir üst seviyeye geçersin. Yeni kelimeler seçtiğin seviyeden gelir. Bir seviye bitince
uygulama seni bir sonraki seviyeye davet eder. Seviyeyi ana sayfadaki seviye kartından ya da Profil'den değiştirebilirsin.

## Hangi öğrenme teknikleri kullanılıyor?

| Teknik | Uygulamada nasıl? |
| --- | --- |
| **Aralıklı tekrar (Spaced Repetition)** | SM-2 tabanlı algoritma. Doğru bildiğin kelime 1 gün → 3 gün → ~1 hafta → ~3 hafta… sonra tekrar sorulur. Yanlış bildiğin 10 dakika sonra geri gelir. |
| **Görsel çağrışım** | Her kelime her cihazda aynı görünen 3D bir görselle eşleşir. Soyut kelimelerde birkaç görsel bir sahne anlatır (ör. *quit* = 👋💼, işe el sallamak). |
| **Renk kodu** | Görselin arka plan rengi kelime türünü gösterir: isim mavi, fiil yeşil, sıfat turuncu, deyimsel fiil pembe. |
| **Kendi görselin** | Bir kelimeye kendi fotoğrafını ya da çizimini ekleyebilirsin; kendi seçtiğin resim en güçlü bağı kurar. |
| **Aktif hatırlama (Active Recall)** | Kelimeyi sadece okumazsın, cevabı kendin bulursun. |
| **Kademeli zorluk** | Önce tanıma (İng → Tr seç), sonra hatırlama (Tr → İng seç / dinleyip seç), en son üretme (İngilizcesini yaz / duyduğunu yaz). |
| **Bağlam** | Her kelime bir örnek cümle ve Türkçe çevirisiyle gelir; kelime cümlede vurgulanır. |
| **Telaffuz** | Kelime ve cümleler sesli okunur (normal ve yavaş hız). Otomatik ses seçimi cihazdaki en doğal kadın sesini seçer (ör. Samantha, Aria, Google US English); Profil'den değiştirilebilir. |
| **Hafıza ipucu (Keyword method)** | Her kelime kartında kendi hafıza ipucunu yazabilirsin (benzer ses + kısa hikâye, ör. *abolish* → “abla iş”); kartta ve yazma sorularında gösterilir, cihazlar arasında eşitlenir. |
| **Önce hatırla** | Kelime kartında 🙈 açıkken kart kapalı gelir: önce anlamı hatırlamaya çalışırsın, sonra karta dokunup çevirirsin. |
| **Favoriler ve Quiz** | Karttaki ♡ ile favorilere eklersin (Kelimeler → ♥ Favoriler). “Quiz ›” baktığın listedeki 10 kelimeyle hemen soru sorar; öğrenilmiş kelimelerin tekrar planı bozulmaz. |
| **YDS tarzı sorular** | Boşluk doldurma (örnek cümle + A–E şıkları, şıklar aynı dilbilgisi biçiminde; bağlaç sorularında *although ↔ despite* gibi ayrımlar) ve eş anlamlı bulma. Sınav hedefinde daha sık çıkar. |
| **Hatalı kelimeyi hemen tekrar** | Oturumda yanlış bilinen kelime birkaç soru sonra tekrar (daha kolay biçimde) sorulur. |
| **Hatalı soru bildirimi** | Her sorunun altındaki **⚑ Hatalı soruyu bildir** ile sebep ve not gönderilir (kurulum: `docs/hesap-kurulumu.md` 6. adım). Bildirilen soruda verilen yanlış cevap sayılmaz. |

## Kendi kelimelerin

**Kelimeler → Kelimelerim** bölümünden (ya da ana sayfadaki hızlı ekleme alanından) kendi kelimelerini ekleyebilirsin:

- **Öneriler:** Kelimeyi yazmaya başlayınca (ör. `im` → *important, image, improve…*) öneriler çıkar. Uygulamada zaten
  olan bir kelime seçilirse anlamı, örnek cümlesi ve eş anlamlıları otomatik dolar.
- **Sözlük önerileri:** İngilizce kelimeyi yazınca Türkçe anlam alanının altında türüne göre gruplanmış öneriler çıkar
  (ör. *table* → isim: masa, tablo · fiil: ertelemek). Dokunarak eklenir, tekrar dokununca çıkar. Toplu eklemede
  yalnızca İngilizce kelime yazılan satırların anlamı da sözlükten önerilir. Öneriler otomatik eşleştirmedir; kontrol
  edilmelidir.
- **Tek tek:** İngilizce kelime ve Türkçe anlam zorunlu; örnek cümle, çevirisi, kelime türü, eş anlamlılar, emoji ve
  kendi fotoğrafın isteğe bağlı. Yazarken kartın önizlemesi görünür. Kelimeler sonradan düzenlenebilir ve silinebilir.
- **Toplu seçip silme:** "☑️ Seç" ile kelimeleri (ya da bir aramanın tüm sonuçlarını) seçip tek seferde sil.
- **Toplu:** Metni yapıştır ya da `.csv` / `.txt` dosyası yükle. Her satır bir kelime:
  `kelime ; anlam ; örnek cümle ; cümlenin çevirisi`. Sekmeyle ayrılmış satırlar (Excel, Google E-Tablolar, Quizlet,
  Anki) ve `kelime - anlam` biçimi de çalışır. Eklemeden önce önizleme gösterilir. Kendi kelimelerinde zaten olan bir kelime **güncellenir** (dosyadaki dolu
  alanlar, ör. sonradan eklenen örnek cümle, eskisinin yerine geçer); hazır listedeki kelimeler atlanır.
  Excel için hazır şablon indirilebilir.
- Kendi kelimelerin, hedefin ne olursa olsun yeni kelimeler arasında **önce** öğretilir ve aynı soru tipleriyle sorulur
  (örnek cümle varsa boşluk doldurma, en az iki eş anlamlı varsa eş anlamlı sorusu).
- Yedek dosyası kendi kelimelerini ve eklediğin fotoğrafları da içerir.

## Hesap ve cihazlar arası eşitleme

İstersen hesap oluşturup telefonda ve bilgisayarda aynı verilerle çalışabilirsin (Profil → ☁️ Hesap, ya da ilk
açılışta "Zaten hesabım var"). Hesap açınca o cihazdaki ilerlemen hesaba taşınır; değişiklikler otomatik eşitlenir.
Hesap olmadan da uygulama tamamen çalışır. Sunucu kurulumu: [docs/hesap-kurulumu.md](docs/hesap-kurulumu.md).

## Gezinme

- Ana sayfa dışındaki her ekranda üstte **← Geri** düğmesi var. Telefonun kendi geri tuşu / geri kaydırma hareketi de
  uygulamadan çıkmak yerine bir önceki ekrana döner.
- Kelime listesinde bir kelimeye dokununca tam ekran açılır; **‹ Önceki / Sonraki ›** düğmeleri, sağa-sola kaydırma ve
  klavyede **← →** tuşlarıyla kelimeler arasında gezinilir.

## Çalıştırma

```bash
npm install
npm run dev      # geliştirme sunucusu: http://localhost:5173
npm test         # birim testleri
npm run build    # üretim derlemesi (dist/)
```

Telefonda kullanmak için GitHub Pages: repo **Settings → Pages → Source: GitHub Actions** seç.
`main` dalına her push'ta uygulama `https://<kullanıcı-adı>.github.io/EnglishMan/` adresinde yayınlanır.
Telefonda açıp tarayıcı menüsünden **"Ana ekrana ekle"** dersen uygulama gibi çalışır.

İlerleme tarayıcının yerel deposunda (localStorage) tutulur. Profil ekranından yedeği dışa/içe aktarabilirsin.

## Proje yapısı

```
src/
  data/a1.ts … c2.ts   Seviyelere göre kelime listeleri (konu, emoji, örnek cümle)
  data/academic*.ts    Akademik Çekirdek kelimeleri ve eş anlamlılar
  data/words.ts        Seviyeler, konular, hedefler, paketler ve tüm kelimelerin birleştirilmesi
  lib/srs.ts           Aralıklı tekrar algoritması
  lib/session.ts       Günlük oturumun oluşturulması, soru tipleri, çeldirici şıklar
  lib/exam.ts          YDS tarzı sorular: boşluk doldurma (çekim uyumlu şıklar) ve eş anlamlı
  lib/answer.ts        Yazılan cevabın kontrolü (yazım hatası toleransı, İng/Amerikan yazımı)
  lib/storage.ts       İlerlemenin kaydı, günlük seri
  lib/catalog.ts       Hazır kelimeler + kullanıcının kendi kelimeleri (tüm uygulama buradan okur)
  lib/customWords.ts   Kendi kelime oluşturma, toplu içe aktarma ayrıştırıcısı, Excel şablonu
  lib/backup.ts        Yedek dosyası (ilerleme + kendi kelimeler + görseller)
  lib/sync/            Hesap ve eşitleme: merge.ts (birleştirme), engine.ts (eşitleme), supabaseBackend.ts
  lib/back.ts          Geri yığını: ekrandaki Geri düğmesi ve telefonun geri tuşu
  lib/suggest.ts       Kelime ekleme önerileri
  lib/dictionary.ts    İngilizce→Türkçe öneri sözlüğü
scripts/build-dictionary.mjs  İngilizce→Türkçe öneri sözlüğünü üretir (public/dictionary-en-tr.json)
wordlist-asset.ts      Öneriler için İngilizce kelime listesini (SCOWL) public/wordlist.txt olarak üretir
  lib/speech.ts        Sesli okuma (tarayıcının Text-to-Speech'i)
  lib/images.ts        Kullanıcının kelimelere eklediği kendi görselleri
emoji-assets.ts        Derlemede kullanılan 3D emoji görsellerini public/emoji/ altına kopyalar
  components/          Ekranlar: Ana sayfa, oturum, kelime listesi, ayarlar
```

Yeni kelime eklemek için ilgili seviye dosyasına (ör. `src/data/b1.ts`) bir satır eklemen yeterli.
`npm test`, kullanılan her emojinin 3D görselinin bulunduğunu kontrol eder.

İngilizce→Türkçe öneri sözlüğü: [KeNet Türkçe WordNet](https://github.com/StarlangSoftware/TurkishWordNet)
(ISC) ve Princeton WordNet 3.1'den `scripts/build-dictionary.mjs` ile üretilir; karşılıklar OpenSubtitles Türkçe kelime
sıklığına göre sıralanır. Ayrıntılar: `public/dictionary-en-tr.NOTICE.txt`.

Kelime önerileri: [SCOWL](http://wordlist.aspell.net/) (Kevin Atkinson; serbest lisans, telif notu
`public/wordlist.txt` başında), [wordlist-english](https://www.npmjs.com/package/wordlist-english) paketi üzerinden.

Görseller: [Microsoft Fluent Emoji 3D](https://github.com/microsoft/fluentui-emoji) (MIT lisansı),
[@lobehub/fluent-emoji-3d](https://www.npmjs.com/package/@lobehub/fluent-emoji-3d) paketi üzerinden.

## Yol haritası

Gelir modeli ve ürünleştirme planı: [docs/is-plani.md](docs/is-plani.md)

- [x] Kelime modülü: aralıklı tekrar, görsel, ses, 5 soru tipi, ilerleme takibi
- [x] A1–C2 seviye seçimi ve seviye testi
- [x] Hedef seçimi (YDS / YÖKDİL / IELTS), sınav tarihi, Akademik Çekirdek paketi ve eş anlamlılar
- [x] YDS tarzı boşluk doldurma ve eş anlamlı soruları, Akademik Çekirdek 302 kelime, açık/koyu tema seçimi
- [x] 3D görseller, görsel sahneler, tür renk kodu, kendi görselini ekleme
- [x] Kendi kelimeni ekleme, düzenleme, toplu içe aktarma (CSV / Excel / Quizlet / Anki)
- [x] Hesap ve cihazlar arası eşitleme (Supabase)
- [ ] Kelime listesini büyütmek
- [x] Kendi kelimelerde sözlükten Türkçe anlam önerisi
- [ ] Yapay zekâ ile anlam, örnek cümle ve çeviri doldurma (premium adayı)
- [ ] Yapay zekâ ile üretilmiş, kelimeye özel çağrışım resimleri
- [ ] Cümle tamamlama (boşluk doldurma) soruları
- [ ] **Reading:** seviyeye uygun kısa metinler, bilinmeyen kelimeye dokununca anlam + listeye ekleme
- [ ] **Listening:** kısa diyaloglar, dikte alıştırmaları
- [ ] **Speaking:** tarayıcının konuşma tanıma özelliğiyle telaffuz kontrolü
- [ ] Çevrimdışı çalışma (service worker) ve cihazlar arası senkronizasyon
