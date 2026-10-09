# EnglishMan 🇬🇧

İngilizceyi öğrenirken birlikte geliştirdiğimiz, kendi kendine test edilen bir öğrenme uygulaması.
İlk modül: **kelime öğrenimi**. 417 kelime: A1'den C2'ye 6 seviye ve sınavlar için **Akademik Çekirdek** paketi.

## Hedefler ve seviyeler

İlk açılışta hedefini seçersin: **YDS**, **YÖKDİL**, **IELTS** ya da **Genel İngilizce**.

- **Sınav hedefleri:** Yeni kelimeler Akademik Çekirdek paketinden (190 kelime, B1→C2 sırasıyla) gelir. Her kelimenin
  eş anlamlıları da gösterilir. *although, whereas, despite* gibi bağlaçlar ve edatlar da pakete dahildir.
  Sınav tarihini girersen ana sayfada kalan gün ve paketi bitirmek için günde kaç yeni kelime gerektiği görünür.
- **Genel İngilizce:** Seviyeni seçersin ya da 2 dakikalık seviye testini yaparsın. Testte her seviyeden 5 kelime sorulur,
4 ve üzeri doğru yaparsan bir üst seviyeye geçersin. Yeni kelimeler seçtiğin seviyeden gelir. Bir seviye bitince
uygulama seni bir sonraki seviyeye davet eder. Seviyeyi ana sayfadaki seviye kartından ya da Ayarlar'dan değiştirebilirsin.

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
| **Telaffuz** | Kelime ve cümleler sesli okunur (normal ve yavaş hız). |
| **Kişisel çağrışım (Keyword method)** | Yeni kelimeye kendi hafıza ipucunu yazabilirsin; yazma sorularında ipucu olarak gösterilir. |
| **Hatalı kelimeyi hemen tekrar** | Oturumda yanlış bilinen kelime birkaç soru sonra tekrar (daha kolay biçimde) sorulur. |

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

İlerleme tarayıcının yerel deposunda (localStorage) tutulur. Ayarlar ekranından yedeği dışa/içe aktarabilirsin.

## Proje yapısı

```
src/
  data/a1.ts … c2.ts   Seviyelere göre kelime listeleri (konu, emoji, örnek cümle)
  data/academic.ts     Akademik Çekirdek kelimeleri ve eş anlamlılar
  data/words.ts        Seviyeler, konular, hedefler, paketler ve tüm kelimelerin birleştirilmesi
  lib/srs.ts           Aralıklı tekrar algoritması
  lib/session.ts       Günlük oturumun oluşturulması, soru tipleri, çeldirici şıklar
  lib/answer.ts        Yazılan cevabın kontrolü (yazım hatası toleransı, İng/Amerikan yazımı)
  lib/storage.ts       İlerlemenin kaydı, günlük seri
  lib/speech.ts        Sesli okuma (tarayıcının Text-to-Speech'i)
  lib/images.ts        Kullanıcının kelimelere eklediği kendi görselleri
emoji-assets.ts        Derlemede kullanılan 3D emoji görsellerini public/emoji/ altına kopyalar
  components/          Ekranlar: Ana sayfa, oturum, kelime listesi, ayarlar
```

Yeni kelime eklemek için ilgili seviye dosyasına (ör. `src/data/b1.ts`) bir satır eklemen yeterli.
`npm test`, kullanılan her emojinin 3D görselinin bulunduğunu kontrol eder.

Görseller: [Microsoft Fluent Emoji 3D](https://github.com/microsoft/fluentui-emoji) (MIT lisansı),
[@lobehub/fluent-emoji-3d](https://www.npmjs.com/package/@lobehub/fluent-emoji-3d) paketi üzerinden.

## Yol haritası

Gelir modeli ve ürünleştirme planı: [docs/is-plani.md](docs/is-plani.md)

- [x] Kelime modülü: aralıklı tekrar, görsel, ses, 5 soru tipi, ilerleme takibi
- [x] A1–C2 seviye seçimi ve seviye testi
- [x] Hedef seçimi (YDS / YÖKDİL / IELTS), sınav tarihi, Akademik Çekirdek paketi ve eş anlamlılar
- [x] 3D görseller, görsel sahneler, tür renk kodu, kendi görselini ekleme
- [ ] Kelime listesini büyütmek (Oxford 3000/5000) ve kendi kelimeni ekleyebilme
- [ ] Yapay zekâ ile üretilmiş, kelimeye özel çağrışım resimleri
- [ ] Cümle tamamlama (boşluk doldurma) soruları
- [ ] **Reading:** seviyeye uygun kısa metinler, bilinmeyen kelimeye dokununca anlam + listeye ekleme
- [ ] **Listening:** kısa diyaloglar, dikte alıştırmaları
- [ ] **Speaking:** tarayıcının konuşma tanıma özelliğiyle telaffuz kontrolü
- [ ] Çevrimdışı çalışma (service worker) ve cihazlar arası senkronizasyon
