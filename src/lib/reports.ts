/**
 * Hatalı soru bildirimleri. Önce bu cihazda sıraya alınır, sunucu (Supabase) varsa oraya gönderilir;
 * internet yoksa ya da gönderilemezse bir sonraki açılışta yeniden denenir.
 */
const KEY = 'englishman:reports:v1';

export const REPORT_REASONS = {
  'wrong-answer': 'Doğru kabul edilen cevap yanlış',
  multiple: 'Birden fazla şık doğru olabilir',
  meaning: 'Türkçe anlam ya da çeviri hatalı',
  sentence: 'Örnek cümle hatalı ya da anlamsız',
  audio: 'Ses / telaffuz hatalı',
  image: 'Görsel uygun değil',
  other: 'Başka bir sorun',
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;

export interface QuestionReport {
  id: string;
  /** Bildirim zamanı (ms). */
  at: number;
  wordId: string;
  word: string;
  mode: string;
  reason: ReportReason;
  note: string;
  /** Sorunun kullanıcıya göründüğü hâli: yönerge, cümle, şıklar, doğru cevap ve kullanıcının cevabı. */
  details: Record<string, unknown>;
}

export function pendingReports(): QuestionReport[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: QuestionReport[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-200)));
  } catch {
    // Depolama doluysa bildirim kaybolur; uygulamanın çalışmasını engellemesin.
  }
}

export function queueReport(r: Omit<QuestionReport, 'id' | 'at'>): QuestionReport {
  const report = { ...r, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, at: Date.now() };
  write([...pendingReports(), report]);
  return report;
}

/** Gönderilen bildirimleri sıradan çıkarır. */
export function markSent(ids: string[]) {
  const sent = new Set(ids);
  write(pendingReports().filter((r) => !sent.has(r.id)));
}
