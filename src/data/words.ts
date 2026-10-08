export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrasal verb';

export interface Word {
  id: string;
  en: string;
  tr: string;
  pos: PartOfSpeech;
  /** Kelimeyi görselleştiren emoji: zihinde kelime ile resim arasında bağ kurar. */
  emoji: string;
  example: string;
  exampleTr: string;
  topic: TopicId;
  level: 'A2' | 'B1';
}

export type TopicId = 'daily' | 'feelings' | 'work' | 'travel' | 'food' | 'nature' | 'verbs' | 'adjectives';

export const TOPICS: Record<TopicId, { name: string; emoji: string }> = {
  daily: { name: 'Günlük Yaşam', emoji: '🏠' },
  feelings: { name: 'Duygular', emoji: '💗' },
  work: { name: 'İş ve Okul', emoji: '💼' },
  travel: { name: 'Seyahat', emoji: '✈️' },
  food: { name: 'Yemek', emoji: '🍲' },
  nature: { name: 'Doğa ve Hava', emoji: '🌿' },
  verbs: { name: 'Temel Fiiller', emoji: '⚡' },
  adjectives: { name: 'Sıfatlar', emoji: '🎨' },
};

export const POS_TR: Record<PartOfSpeech, string> = {
  noun: 'isim',
  verb: 'fiil',
  adjective: 'sıfat',
  adverb: 'zarf',
  'phrasal verb': 'deyimsel fiil',
};

type Row = [en: string, tr: string, pos: PartOfSpeech, emoji: string, example: string, exampleTr: string, level: 'A2' | 'B1'];

const RAW: Record<TopicId, Row[]> = {
  daily: [
    ['borrow', 'ödünç almak', 'verb', '🤲', 'Can I borrow your pen?', 'Kalemini ödünç alabilir miyim?', 'A2'],
    ['lend', 'ödünç vermek', 'verb', '🤝', 'She lent me some money.', 'Bana biraz para ödünç verdi.', 'A2'],
    ['appointment', 'randevu', 'noun', '📅', "I have a doctor's appointment at three.", 'Saat üçte doktor randevum var.', 'A2'],
    ['neighbour', 'komşu', 'noun', '🏘️', 'Our neighbours are very friendly.', 'Komşularımız çok cana yakın.', 'A2'],
    ['laundry', 'çamaşır', 'noun', '🧺', 'I do the laundry on Sundays.', 'Pazar günleri çamaşır yıkarım.', 'B1'],
    ['rent', 'kira', 'noun', '🔑', 'The rent is too expensive here.', 'Burada kira çok pahalı.', 'A2'],
    ['bill', 'fatura, hesap', 'noun', '🧾', 'Can we have the bill, please?', 'Hesabı alabilir miyiz lütfen?', 'A2'],
    ['queue', 'kuyruk, sıra', 'noun', '🧍', 'There was a long queue at the bank.', 'Bankada uzun bir kuyruk vardı.', 'B1'],
    ['habit', 'alışkanlık', 'noun', '🔁', 'Reading before bed is a good habit.', 'Yatmadan önce okumak iyi bir alışkanlıktır.', 'B1'],
    ['chore', 'ev işi', 'noun', '🧹', 'I hate household chores.', 'Ev işlerinden nefret ediyorum.', 'B1'],
    ['wake up', 'uyanmak', 'phrasal verb', '⏰', 'I usually wake up at seven.', 'Genellikle yedide uyanırım.', 'A2'],
    ['get dressed', 'giyinmek', 'verb', '👕', 'He got dressed quickly.', 'Hızlıca giyindi.', 'A2'],
  ],
  feelings: [
    ['proud', 'gururlu', 'adjective', '🦁', "I'm proud of you.", 'Seninle gurur duyuyorum.', 'A2'],
    ['embarrassed', 'utanmış, mahcup', 'adjective', '😳', 'I felt embarrassed when I fell.', 'Düştüğümde utandım.', 'B1'],
    ['worried', 'endişeli', 'adjective', '😟', 'She is worried about her exam.', 'Sınavı için endişeli.', 'A2'],
    ['disappointed', 'hayal kırıklığına uğramış', 'adjective', '😞', 'We were disappointed with the film.', 'Filmden hayal kırıklığına uğradık.', 'B1'],
    ['relieved', 'rahatlamış', 'adjective', '😌', 'I was relieved to hear the news.', 'Haberi duyunca rahatladım.', 'B1'],
    ['jealous', 'kıskanç', 'adjective', '😒', 'He is jealous of his brother.', 'Kardeşini kıskanıyor.', 'B1'],
    ['lonely', 'yalnız (hisseden)', 'adjective', '🥀', 'She felt lonely in the big city.', 'Büyük şehirde kendini yalnız hissetti.', 'A2'],
    ['confident', 'kendinden emin', 'adjective', '😎', 'Be confident when you speak English.', 'İngilizce konuşurken kendinden emin ol.', 'B1'],
    ['scared', 'korkmuş', 'adjective', '😨', 'My little sister is scared of dogs.', 'Küçük kız kardeşim köpeklerden korkar.', 'A2'],
    ['grateful', 'minnettar', 'adjective', '🙏', "I'm grateful for your help.", 'Yardımın için minnettarım.', 'B1'],
    ['upset', 'üzgün, morali bozuk', 'adjective', '😢', "Don't be upset, it's not your fault.", 'Üzülme, senin hatan değil.', 'A2'],
    ['bored', 'sıkılmış', 'adjective', '🥱', "I'm bored. Let's go out.", 'Sıkıldım. Hadi dışarı çıkalım.', 'A2'],
  ],
  work: [
    ['colleague', 'iş arkadaşı', 'noun', '👩‍💼', 'My colleagues are very helpful.', 'İş arkadaşlarım çok yardımsever.', 'B1'],
    ['salary', 'maaş', 'noun', '💰', 'He gets a good salary.', 'İyi bir maaş alıyor.', 'B1'],
    ['deadline', 'son teslim tarihi', 'noun', '⏳', 'The deadline for the project is Friday.', 'Projenin son teslim tarihi cuma.', 'B1'],
    ['interview', 'mülakat, görüşme', 'noun', '🎤', 'I have a job interview tomorrow.', 'Yarın bir iş görüşmem var.', 'A2'],
    ['experience', 'deneyim', 'noun', '🧗', 'Do you have any work experience?', 'Herhangi bir iş deneyimin var mı?', 'A2'],
    ['skill', 'beceri', 'noun', '🛠️', 'Communication is an important skill.', 'İletişim önemli bir beceridir.', 'A2'],
    ['improve', 'geliştirmek', 'verb', '📈', 'I want to improve my English.', 'İngilizcemi geliştirmek istiyorum.', 'A2'],
    ['achieve', 'başarmak, ulaşmak', 'verb', '🏆', 'You can achieve your goals.', 'Hedeflerine ulaşabilirsin.', 'B1'],
    ['fail', 'başarısız olmak', 'verb', '❌', 'He failed his driving test.', 'Ehliyet sınavında başarısız oldu.', 'A2'],
    ['degree', 'diploma (üniversite)', 'noun', '🎓', 'She has a degree in engineering.', 'Mühendislik diploması var.', 'B1'],
    ['hire', 'işe almak', 'verb', '📝', 'The company hired ten new people.', 'Şirket on yeni kişiyi işe aldı.', 'B1'],
    ['quit', '(işi) bırakmak', 'verb', '🚪', 'He quit his job last month.', 'Geçen ay işini bıraktı.', 'B1'],
    ['meeting', 'toplantı', 'noun', '🗣️', 'The meeting starts at ten.', 'Toplantı saat onda başlıyor.', 'A2'],
    ['earn', '(para) kazanmak', 'verb', '💵', 'How much do you earn?', 'Ne kadar kazanıyorsun?', 'A2'],
  ],
  travel: [
    ['luggage', 'bagaj, valiz', 'noun', '🧳', 'Where can I leave my luggage?', 'Bagajımı nereye bırakabilirim?', 'A2'],
    ['journey', 'yolculuk', 'noun', '🛤️', 'The journey took six hours.', 'Yolculuk altı saat sürdü.', 'A2'],
    ['abroad', 'yurt dışı(na/nda)', 'adverb', '🌐', "I've never been abroad.", 'Hiç yurt dışına gitmedim.', 'B1'],
    ['destination', 'varış yeri', 'noun', '📍', 'Paris is a popular destination.', 'Paris popüler bir gezi noktasıdır.', 'B1'],
    ['delay', 'gecikme', 'noun', '⏱️', 'There is a two-hour delay.', 'İki saatlik bir gecikme var.', 'B1'],
    ['book', 'rezervasyon yapmak', 'verb', '🏨', 'I booked a hotel room.', 'Bir otel odası ayırttım.', 'A2'],
    ['passenger', 'yolcu', 'noun', '💺', 'All passengers must show their tickets.', 'Tüm yolcular biletlerini göstermek zorunda.', 'A2'],
    ['sightseeing', 'gezip görme', 'noun', '📸', 'We went sightseeing in Rome.', "Roma'da turistik yerleri gezdik.", 'B1'],
    ['accommodation', 'konaklama', 'noun', '🛏️', 'The price includes accommodation.', 'Fiyata konaklama dahil.', 'B1'],
    ['miss', 'kaçırmak', 'verb', '🏃', "Hurry up or we'll miss the bus!", 'Acele et yoksa otobüsü kaçıracağız!', 'A2'],
    ['arrive', 'varmak', 'verb', '🛬', 'We arrived in London at midnight.', "Gece yarısı Londra'ya vardık.", 'A2'],
    ['souvenir', 'hediyelik eşya', 'noun', '🗿', 'I bought a souvenir for my mum.', 'Annem için bir hediyelik eşya aldım.', 'B1'],
  ],
  food: [
    ['delicious', 'lezzetli', 'adjective', '😋', 'This soup is delicious!', 'Bu çorba çok lezzetli!', 'A2'],
    ['recipe', 'tarif', 'noun', '📜', 'Can you give me the recipe?', 'Bana tarifi verebilir misin?', 'A2'],
    ['ingredient', 'malzeme (yemek)', 'noun', '🥕', 'What are the ingredients?', 'Malzemeler neler?', 'B1'],
    ['boil', 'kaynatmak', 'verb', '♨️', 'Boil the water first.', 'Önce suyu kaynat.', 'A2'],
    ['fry', 'kızartmak', 'verb', '🍳', 'She fried some eggs.', 'Birkaç yumurta kızarttı.', 'A2'],
    ['spicy', 'acılı, baharatlı', 'adjective', '🌶️', 'I love spicy food.', 'Acılı yemeği çok severim.', 'A2'],
    ['hungry', 'aç', 'adjective', '🍽️', "I'm so hungry!", 'Çok açım!', 'A2'],
    ['thirsty', 'susamış', 'adjective', '🥤', 'Are you thirsty?', 'Susadın mı?', 'A2'],
    ['dessert', 'tatlı (yemek sonrası)', 'noun', '🍰', "What's for dessert?", 'Tatlı olarak ne var?', 'A2'],
    ['vegetarian', 'vejetaryen', 'adjective', '🥗', 'My sister is vegetarian.', 'Kız kardeşim vejetaryen.', 'A2'],
  ],
  nature: [
    ['weather', 'hava (durumu)', 'noun', '🌦️', 'The weather is lovely today.', 'Bugün hava çok güzel.', 'A2'],
    ['forecast', 'hava tahmini', 'noun', '📺', 'The forecast says it will rain.', 'Hava tahminine göre yağmur yağacak.', 'B1'],
    ['storm', 'fırtına', 'noun', '⛈️', 'A storm is coming.', 'Bir fırtına geliyor.', 'A2'],
    ['cloudy', 'bulutlu', 'adjective', '☁️', "It's cloudy but warm.", 'Hava bulutlu ama ılık.', 'A2'],
    ['freezing', 'buz gibi, dondurucu', 'adjective', '🥶', "It's freezing outside!", 'Dışarısı buz gibi!', 'B1'],
    ['environment', 'çevre', 'noun', '🌍', 'We must protect the environment.', 'Çevreyi korumalıyız.', 'B1'],
    ['pollution', 'kirlilik', 'noun', '🏭', 'Air pollution is a big problem.', 'Hava kirliliği büyük bir sorun.', 'B1'],
    ['coast', 'sahil, kıyı', 'noun', '🏖️', 'They live on the coast.', 'Sahilde yaşıyorlar.', 'B1'],
    ['hill', 'tepe', 'noun', '🏞️', 'We walked up the hill.', 'Tepeye yürüyerek çıktık.', 'A2'],
    ['wildlife', 'yaban hayatı', 'noun', '🦊', 'The park is full of wildlife.', 'Park yaban hayatıyla dolu.', 'B1'],
  ],
  verbs: [
    ['remember', 'hatırlamak', 'verb', '🧠', "I can't remember his name.", 'Onun adını hatırlayamıyorum.', 'A2'],
    ['forget', 'unutmak', 'verb', '🤷', "Don't forget your keys.", 'Anahtarlarını unutma.', 'A2'],
    ['decide', 'karar vermek', 'verb', '⚖️', 'We decided to stay at home.', 'Evde kalmaya karar verdik.', 'A2'],
    ['explain', 'açıklamak', 'verb', '👨‍🏫', 'Can you explain this word?', 'Bu kelimeyi açıklayabilir misin?', 'A2'],
    ['agree', 'katılmak, aynı fikirde olmak', 'verb', '👍', 'I agree with you.', 'Sana katılıyorum.', 'A2'],
    ['complain', 'şikâyet etmek', 'verb', '😤', 'He always complains about the food.', 'Hep yemekten şikâyet ediyor.', 'B1'],
    ['suggest', 'önermek', 'verb', '💡', 'I suggest we take a taxi.', 'Taksiye binmemizi öneriyorum.', 'B1'],
    ['avoid', 'kaçınmak', 'verb', '🙅', 'Try to avoid sugar.', 'Şekerden kaçınmaya çalış.', 'B1'],
    ['manage', 'başarmak, becermek', 'verb', '🧩', 'Did you manage to finish it?', 'Bitirmeyi başarabildin mi?', 'B1'],
    ['afford', '(parası) yetmek', 'verb', '💳', "I can't afford a new car.", 'Yeni bir arabaya param yetmez.', 'B1'],
    ['pretend', '-mış gibi yapmak', 'verb', '🎭', 'He pretended to be asleep.', 'Uyuyormuş gibi yaptı.', 'B1'],
    ['realise', 'fark etmek', 'verb', '❗', 'I realised I was wrong.', 'Yanıldığımı fark ettim.', 'B1'],
    ['persuade', 'ikna etmek', 'verb', '🫱', 'She persuaded me to come.', 'Gelmem için beni ikna etti.', 'B1'],
    ['look forward to', 'dört gözle beklemek', 'phrasal verb', '🤩', "I'm looking forward to the holiday.", 'Tatili dört gözle bekliyorum.', 'B1'],
    ['give up', 'vazgeçmek', 'phrasal verb', '🏳️', 'Never give up!', 'Asla vazgeçme!', 'A2'],
    ['find out', 'öğrenmek, ortaya çıkarmak', 'phrasal verb', '🔍', 'I found out the truth.', 'Gerçeği öğrendim.', 'B1'],
    ['turn down', 'reddetmek', 'phrasal verb', '👎', 'She turned down the job offer.', 'İş teklifini reddetti.', 'B1'],
    ['get on with', 'iyi geçinmek', 'phrasal verb', '🤗', 'I get on well with my brother.', 'Kardeşimle iyi geçinirim.', 'B1'],
  ],
  adjectives: [
    ['reliable', 'güvenilir', 'adjective', '🛡️', 'He is a reliable friend.', 'O güvenilir bir arkadaş.', 'B1'],
    ['polite', 'kibar', 'adjective', '🎩', 'Be polite to everyone.', 'Herkese karşı kibar ol.', 'A2'],
    ['rude', 'kaba', 'adjective', '😠', "It's rude to interrupt.", 'Lafı bölmek kabalıktır.', 'A2'],
    ['lazy', 'tembel', 'adjective', '🦥', 'My cat is very lazy.', 'Kedim çok tembel.', 'A2'],
    ['generous', 'cömert', 'adjective', '💝', "It's very generous of you.", 'Çok cömertsin.', 'B1'],
    ['crowded', 'kalabalık', 'adjective', '🚌', 'The bus was very crowded.', 'Otobüs çok kalabalıktı.', 'A2'],
    ['noisy', 'gürültülü', 'adjective', '🔊', 'The street is very noisy.', 'Sokak çok gürültülü.', 'A2'],
    ['cheap', 'ucuz', 'adjective', '🏷️', 'This shirt was very cheap.', 'Bu gömlek çok ucuzdu.', 'A2'],
    ['expensive', 'pahalı', 'adjective', '💎', 'London is an expensive city.', 'Londra pahalı bir şehir.', 'A2'],
    ['dangerous', 'tehlikeli', 'adjective', '⚠️', 'Swimming here is dangerous.', 'Burada yüzmek tehlikeli.', 'A2'],
    ['healthy', 'sağlıklı', 'adjective', '🍎', 'Eat healthy food.', 'Sağlıklı yiyecekler ye.', 'A2'],
    ['busy', 'meşgul, yoğun', 'adjective', '🐝', "I'm busy right now.", 'Şu an meşgulüm.', 'A2'],
    ['similar', 'benzer', 'adjective', '👯', 'Our ideas are similar.', 'Fikirlerimiz benzer.', 'B1'],
    ['available', 'müsait, mevcut', 'adjective', '✅', 'Are you available on Monday?', 'Pazartesi müsait misin?', 'B1'],
  ],
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-');

export const WORDS: Word[] = (Object.keys(RAW) as TopicId[]).flatMap((topic) =>
  RAW[topic].map(([en, tr, pos, emoji, example, exampleTr, level]) => ({
    id: `${topic}:${slug(en)}`,
    en,
    tr,
    pos,
    emoji,
    example,
    exampleTr,
    topic,
    level,
  })),
);

export const WORDS_BY_ID: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.id, w]));
