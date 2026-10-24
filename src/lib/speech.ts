/** Tarayıcının yerleşik sesli okuma (Text-to-Speech) özelliği. İnternet ya da API anahtarı gerektirmez. */

/** Bu hızın altı "yavaş" sayılır. */
const SLOW_THRESHOLD = 0.8;
/** "Yavaş dinle" butonlarının hızı. */
export const SLOW_RATE = 0.55;

let preferredVoiceURI: string | null = null;

/** Ayarlardan seçilen ses (null: otomatik seçim). */
export function setPreferredVoice(uri: string | null): void {
  preferredVoiceURI = uri;
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function englishVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
}

/** Sesler tarayıcıda geç yüklenir; liste değişince haber verir. */
export function onVoicesChanged(cb: () => void): () => void {
  if (!canSpeak()) return () => {};
  window.speechSynthesis.addEventListener('voiceschanged', cb);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', cb);
}

// Bilinen yumuşak/doğal kadın sesleri (Edge, Chrome, Safari/iOS, macOS, Windows, Android).
const FEMALE =
  /\b(aria|jenny|sonia|libby|maisie|emma|ava|michelle|natasha|clara|samantha|serena|kate|stephanie|martha|allison|susan|karen|moira|tessa|fiona|victoria|zira|hazel|catherine|nicky|joanna|kendra|kimberly|salli|amy|female)\b/i;
const MALE =
  /\b(daniel|alex|fred|arthur|oliver|tom|aaron|rishi|david|mark|george|ryan|guy|gordon|lee|james|eric|christopher|brian|thomas|male|ralph|albert|bruce|junior|rocko|grandpa|reed|eddy)\b/i;
// Android'deki Google seslerinin kimlikleri (ör. en-us-x-sfg-local): bu kodlar kadın sesleridir.
const ANDROID_FEMALE = /-x-(sfg|tpf|tpc|iob|iog|gba|gbc|gbg)-/i;
// Robotik/eğlence sesleri (macOS) hiç seçilmesin.
const NOVELTY = /\b(bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert)\b/i;

/** Otomatik seçimde sesin puanı: doğal kadın sesleri en üstte, erkek ve robotik sesler en altta. */
export function voiceScore(v: Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'voiceURI'>): number {
  const id = `${v.name} ${v.voiceURI}`;
  let score = 0;
  if (FEMALE.test(v.name) || ANDROID_FEMALE.test(id)) score += 10;
  if (MALE.test(v.name)) score -= 10;
  if (NOVELTY.test(v.name)) score -= 50;
  if (/natural|neural|premium|enhanced|online/i.test(v.name)) score += 6;
  // Google'ın "US English" sesi kadın, "UK English Male" erkek sesidir.
  if (/google us english|google uk english female/i.test(v.name)) score += 8;
  if (/compact|espeak/i.test(id)) score -= 5;
  if (/^en[-_](us|gb)/i.test(v.lang)) score += 1;
  return score;
}

function pickVoice(slow: boolean): SpeechSynthesisVoice | null {
  const english = englishVoices();
  const preferred = english.find((v) => v.voiceURI === preferredVoiceURI);
  if (preferred) return preferred;
  // İnternet üzerinden çalışan sesler (ör. Chrome'daki "Google" sesleri) hız ayarını çoğu zaman yok sayar;
  // yavaş okumada cihazın kendi (yerel) sesleri tercih edilir.
  const pool = slow && english.some((v) => v.localService) ? english.filter((v) => v.localService) : english;
  return bestVoice(pool);
}

/** Listedeki en hoş sesi seçer (eşitlikte tarayıcının varsayılan sesi). */
export function bestVoice<T extends Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'voiceURI' | 'default'>>(voices: T[]): T | null {
  let best: T | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    const score = voiceScore(v) + (v.default ? 0.5 : 0);
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}

/** Ayarlarda "Otomatik" seçiliyken kullanılan sesin adı. */
export function autoVoiceName(): string | null {
  return bestVoice(englishVoices())?.name ?? null;
}

export function speak(text: string, rate = 0.9): void {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  const slow = rate < SLOW_THRESHOLD;
  const voice = pickVoice(slow);
  // Yavaş modda cümle kelime kelime okunur: ses motoru hız ayarını desteklemese bile
  // kelimeler arasındaki duraklamalar okumayı belirgin şekilde yavaşlatır.
  const parts = slow ? text.trim().split(/\s+/) : [text];

  const run = () => {
    for (const part of parts) {
      const u = new SpeechSynthesisUtterance(part);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? 'en-GB';
      u.rate = rate;
      u.pitch = 1.05;
      synth.speak(u);
    }
  };

  // Bazı tarayıcılar cancel()'dan hemen sonra gelen yeni isteği düşürür ya da ayarlarını yok sayar.
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(run, 100);
  } else {
    run();
  }
}
