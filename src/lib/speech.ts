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

function pickVoice(slow: boolean): SpeechSynthesisVoice | null {
  const english = englishVoices();
  const preferred = english.find((v) => v.voiceURI === preferredVoiceURI);
  if (preferred) return preferred;
  // İnternet üzerinden çalışan sesler (ör. Chrome'daki "Google" sesleri) hız ayarını çoğu zaman yok sayar;
  // yavaş okumada cihazın kendi (yerel) sesleri tercih edilir.
  const pool = slow && english.some((v) => v.localService) ? english.filter((v) => v.localService) : english;
  const good = /google|natural|premium|enhanced|siri/i;
  return (
    pool.find((v) => /en-gb/i.test(v.lang) && good.test(v.name)) ??
    pool.find((v) => /en-us/i.test(v.lang) && good.test(v.name)) ??
    pool.find((v) => /en-gb/i.test(v.lang)) ??
    pool[0] ??
    null
  );
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
