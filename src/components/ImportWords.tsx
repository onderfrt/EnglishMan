import { useEffect, useMemo, useRef, useState } from 'react';
import type { Level, Word } from '../data/words';
import { applyChanges, importTemplate, newCustomId, parseImport, toCustomWord, UPDATABLE, type ImportStatus } from '../lib/customWords';
import { useBack } from '../lib/back';
import { bestMeaning, loadDictionary, lookup } from '../lib/dictionary';
import { downloadText } from '../lib/download';
import { BackBar } from './BackBar';

interface Props {
  level: Level;
  /** Yeni kelimeler ve güncellenen kendi kelimeler. */
  onImport: (added: Word[], updated: Word[]) => void;
  onClose: () => void;
}

const STATUS: Record<ImportStatus, { label: string; className: string }> = {
  new: { label: 'Eklenecek', className: 'status-mastered' },
  update: { label: 'Güncellenecek', className: 'status-update' },
  unchanged: { label: 'Değişiklik yok', className: 'status-new' },
  builtin: { label: 'Hazır listede var, atlanacak', className: 'status-learning' },
  repeat: { label: 'Dosyada tekrar, atlanacak', className: 'status-learning' },
  invalid: { label: 'Anlam eksik', className: 'status-wrong' },
};

/** Toplu kelime ekleme: metin yapıştır ya da dosya yükle, önizle, ekle. */
export function ImportWords({ level, onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [dict, setDict] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    loadDictionary().then(setDict);
  }, []);
  // Yalnızca İngilizce kelime yazılan satırlarda anlam sözlükten önerilir.
  const rows = useMemo(() => parseImport(text, (en) => bestMeaning(lookup(en, dict))), [text, dict]);
  const fresh = rows.filter((r) => r.status === 'new');
  const updates = rows.filter((r) => r.status === 'update');
  const skipped = rows.length - fresh.length - updates.length;

  const add = () => {
    onImport(
      fresh.map((r) => toCustomWord(r.input, newCustomId(), level)),
      updates.map((r) => applyChanges(r.existing!, r.changes)),
    );
  };

  const actionLabel = [fresh.length && `${fresh.length} kelimeyi ekle`, updates.length && `${updates.length} kelimeyi güncelle`]
    .filter(Boolean)
    .join(', ');

  useBack(true, onClose);

  return (
    <div className="viewer import-words">
      <BackBar title="Toplu kelime ekle" />
      <div className="card">
        <p className="muted small">
          Her satıra bir kelime yaz. Alanları <b>noktalı virgül</b> ya da <b>sekme</b> ile ayır:
        </p>
        <pre className="format">kelime ; anlam ; örnek cümle ; cümlenin çevirisi</pre>
        <ul className="muted small format-tips">
          <li>Yalnızca kelime ve anlam da yeterli: <code>abandon - terk etmek</code></li>
          <li>Yalnızca İngilizce kelime yazarsan anlamı sözlükten önerilir; eklemeden önce önizlemede kontrol et.</li>
          <li>Excel ya da Google E-Tablolar'dan sütunları kopyalayıp yapıştırabilirsin.</li>
          <li>Quizlet ve Anki'den dışa aktardığın listeler de çalışır.</li>
          <li>
            Kendi kelimelerinde olan bir kelimeyi yeniden yüklersen <b>güncellenir</b>: dosyadaki dolu alanlar (ör. sonradan
            eklediğin örnek cümle) eskisinin yerine geçer, boş alanlar olduğu gibi kalır.
          </li>
        </ul>
        <textarea
          className="import-text"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'abandon ; terk etmek ; They had to abandon the car. ; Arabayı terk etmek zorunda kaldılar.\nreluctant ; isteksiz'}
          autoCapitalize="off"
          spellCheck={false}
        />
        <div className="row">
          <button className="btn" onClick={() => fileRef.current?.click()}>
            📄 Dosyadan yükle
          </button>
          <button
            className="btn"
            onClick={() => downloadText('englishman-kelime-sablonu.csv', importTemplate(), 'text/csv;charset=utf-8')}
          >
            ⬇️ Excel şablonu
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/plain"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) setText(await f.text());
            }}
          />
        </div>
      </div>

      {rows.length > 0 && (
        <div className="card">
          <p className="prompt">
            Önizleme · {fresh.length} yeni, {updates.length} güncellenecek
            {skipped ? `, ${skipped} satır atlanacak` : ''}
          </p>
          <ul className="import-preview">
            {rows.map((r) => (
              <li key={r.line}>
                <span className="row-text">
                  <b>{r.input.en || '—'}</b>
                  <span className="muted">
                    {r.input.tr || 'anlam yok'}
                    {r.autoMeaning && <span className="sugg-tag"> · 📖 sözlükten</span>}
                  </span>
                  {r.input.example && <span className="muted small">“{r.input.example}”</span>}
                  {r.status === 'builtin' && r.existing && (
                    <span className="muted small">Uygulamadaki anlamı: {r.existing.tr}</span>
                  )}
                  {r.status === 'update' && r.changes && (
                    <span className="small update-note">
                      Değişecek: {Object.keys(r.changes).map((f) => UPDATABLE[f as keyof typeof UPDATABLE]).join(', ')}
                    </span>
                  )}
                </span>
                <span className={`status ${STATUS[r.status].className}`}>{STATUS[r.status].label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-actions">
        <button className="btn" onClick={onClose}>
          Vazgeç
        </button>
        <button className="btn btn-primary" onClick={add} disabled={!actionLabel}>
          {actionLabel || 'Kelime ekle'}
        </button>
      </div>
    </div>
  );
}
