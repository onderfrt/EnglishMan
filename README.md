# EnglishMan 🇬🇧

İngilizceyi öğrenirken birlikte geliştirdiğimiz, kendi kendine test edilen bir öğrenme uygulaması.
İlk modül: **kelime öğrenimi** (A2–B1 / pre-intermediate seviye).

## Hangi öğrenme teknikleri kullanılıyor?

| Teknik | Uygulamada nasıl? |
| --- | --- |
| **Aralıklı tekrar (Spaced Repetition)** | SM-2 tabanlı algoritma. Doğru bildiğin kelime 1 gün → 3 gün → ~1 hafta → ~3 hafta… sonra tekrar sorulur. Yanlış bildiğin 10 dakika sonra geri gelir. |
| **Görsel çağrışım** | Her kelime bir görselle (emoji) eşleşir. (Wordjin'deki gibi resimle hatırlama.) |
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
  data/words.ts        Kelime listesi (konu, emoji, örnek cümle, seviye)
  lib/srs.ts           Aralıklı tekrar algoritması
  lib/session.ts       Günlük oturumun oluşturulması, soru tipleri, çeldirici şıklar
  lib/answer.ts        Yazılan cevabın kontrolü (yazım hatası toleransı, İng/Amerikan yazımı)
  lib/storage.ts       İlerlemenin kaydı, günlük seri
  lib/speech.ts        Sesli okuma (tarayıcının Text-to-Speech'i)
  components/          Ekranlar: Ana sayfa, oturum, kelime listesi, ayarlar
```

Yeni kelime eklemek için `src/data/words.ts` içindeki ilgili konuya bir satır eklemen yeterli.

## Yol haritası

- [x] Kelime modülü: aralıklı tekrar, görsel, ses, 5 soru tipi, ilerleme takibi
- [ ] Kelime listesini büyütmek (Oxford 3000'den A2–B1 kelimeler) ve kendi kelimeni ekleyebilme
- [ ] Gerçek görseller / yapay zekâ ile üretilmiş çağrışım resimleri
- [ ] Cümle tamamlama (boşluk doldurma) soruları
- [ ] **Reading:** seviyeye uygun kısa metinler, bilinmeyen kelimeye dokununca anlam + listeye ekleme
- [ ] **Listening:** kısa diyaloglar, dikte alıştırmaları
- [ ] **Speaking:** tarayıcının konuşma tanıma özelliğiyle telaffuz kontrolü
- [ ] Çevrimdışı çalışma (service worker) ve cihazlar arası senkronizasyon
