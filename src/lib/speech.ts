/** Tarayıcının yerleşik sesli okuma (Text-to-Speech) özelliği. İnternet ya da API anahtarı gerektirmez. */

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // Sesler henüz yüklenmedi, sonraki çağrıda tekrar dene.
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  cachedVoice =
    english.find((v) => /en-gb/i.test(v.lang) && /google|natural|premium|enhanced/i.test(v.name)) ??
    english.find((v) => /en-us/i.test(v.lang) && /google|natural|premium|enhanced/i.test(v.name)) ??
    english.find((v) => /en-gb/i.test(v.lang)) ??
    english[0] ??
    null;
  return cachedVoice;
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, rate = 0.9): void {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? 'en-GB';
  u.rate = rate;
  synth.speak(u);
}
