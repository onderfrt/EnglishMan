import { useState } from 'react';
import { useBack } from '../lib/back';
import { queueReport, REPORT_REASONS, type QuestionReport, type ReportReason } from '../lib/reports';
import { flushReports } from '../lib/sync/engine';

interface Props {
  report: Omit<QuestionReport, 'id' | 'at' | 'reason' | 'note'>;
  /** Kullanıcı bu soruyu yanlış cevapladıysa: bildirince yanlışı sayılmaz. */
  answeredWrong: boolean;
  onSent: () => void;
  onClose: () => void;
}

/** "Hatalı soruyu bildir" paneli: sebep + isteğe bağlı not. */
export function ReportSheet({ report, answeredWrong, onSent, onClose }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState<'sent' | 'queued' | null>(null);
  useBack(true, onClose);

  const send = async () => {
    if (!reason) return;
    queueReport({ ...report, reason, note: note.trim() });
    onSent();
    setDone((await flushReports()) ? 'sent' : 'queued');
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Hatalı soruyu bildir" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <h3>Teşekkürler! 🙏</h3>
            <p className="muted">
              {done === 'sent'
                ? 'Bildirimin bize ulaştı. Soruyu inceleyip düzelteceğiz.'
                : 'Bildirimin kaydedildi; internet bağlantısı olunca gönderilecek.'}
            </p>
            {answeredWrong && <p className="small notice-ok">Bu sorudaki cevabın yanlış sayılmadı.</p>}
            <button className="btn btn-primary btn-block" onClick={onClose}>
              Tamam
            </button>
          </>
        ) : (
          <>
            <h3>Hatalı soruyu bildir</h3>
            <p className="muted small">
              “{report.word}” sorusunda ne yanlış? Bildirimler soruları düzeltmemize yardım ediyor.
            </p>
            <div className="reason-list" role="radiogroup" aria-label="Sorun">
              {(Object.keys(REPORT_REASONS) as ReportReason[]).map((r) => (
                <button key={r} role="radio" aria-checked={reason === r} className={`reason ${reason === r ? 'active' : ''}`} onClick={() => setReason(r)}>
                  <span className="radio-dot" />
                  {REPORT_REASONS[r]}
                </button>
              ))}
            </div>
            <label className="field">
              <span>Not (isteğe bağlı)</span>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ör. Doğru cevap “accomplish” olmalı" />
            </label>
            {answeredWrong && reason && (
              <p className="small muted">Gönderince bu sorudaki yanlış cevabın tekrar planına işlenmez.</p>
            )}
            <div className="row">
              <button className="btn" onClick={onClose}>
                Vazgeç
              </button>
              <button className="btn btn-primary" onClick={send} disabled={!reason}>
                Gönder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** "⚑ Hatalı soruyu bildir" bağlantısı ve paneli. */
export function ReportLink({
  getReport,
  answeredWrong = false,
  onSent,
  label = '⚑ Hatalı soruyu bildir',
}: {
  getReport: () => Props['report'];
  answeredWrong?: boolean;
  onSent?: () => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <>
      <button type="button" className="report-link" onClick={() => setOpen(true)} disabled={sent}>
        {sent ? '✓ Bildirildi, teşekkürler' : label}
      </button>
      {open && (
        <ReportSheet
          report={getReport()}
          answeredWrong={answeredWrong}
          onSent={() => {
            setSent(true);
            onSent?.();
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
