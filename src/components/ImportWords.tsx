import { useMemo, useRef, useState } from 'react';
import type { Level, Word } from '../data/words';
import { importTemplate, newCustomId, parseImport, toCustomWord } from '../lib/customWords';
import { downloadText } from '../lib/download';

interface Props {
  level: Level;
  onImport: (words: Word[]) => void;
  onClose: () => void;
}

const STATUS = {
  new: { label: 'Eklenecek', className: 'status-mastered' },
  duplicate: { label: 'Zaten var, atlanacak', className: 'status-learning' },
  invalid: { label: 'Anlam eksik', className: 'status-wrong' },
};

/** Toplu kelime ekleme: metin yapıştır ya da dosya yükle, önizle, ekle. */
export function ImportWords({ level, onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const rows = useMemo(() => parseImport(text), [text]);
  const fresh = rows.filter((r) => r.status === 'new');

  const add = () => {
    onImport(fresh.map((r) => toCustomWord(r.input, newCustomId(), level)));
  };

  return (
    <div className="import-words">
      <div className="card">
        <h2>Toplu kelime ekle</h2>
        <p className="muted small">
          Her satıra bir kelime yaz. Alanları <b>noktalı virgül</b> ya da <b>sekme</b> ile ayır:
        </p>
        <pre className="format">kelime ; anlam ; örnek cümle ; cümlenin çevirisi</pre>
        <ul className="muted small format-tips">
          <li>Yalnızca kelime ve anlam da yeterli: <code>abandon - terk etmek</code></li>
          <li>Excel ya da Google E-Tablolar'dan sütunları kopyalayıp yapıştırabilirsin.</li>
          <li>Quizlet ve Anki'den dışa aktardığın listeler de çalışır.</li>
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
            Önizleme · {fresh.length} yeni kelime
            {rows.length > fresh.length ? `, ${rows.length - fresh.length} satır atlanacak` : ''}
          </p>
          <ul className="import-preview">
            {rows.map((r) => (
              <li key={r.line}>
                <span className="row-text">
                  <b>{r.input.en || '—'}</b>
                  <span className="muted">{r.input.tr || 'anlam yok'}</span>
                  {r.input.example && <span className="muted small">“{r.input.example}”</span>}
                  {r.status === 'duplicate' && r.existing && (
                    <span className="muted small">Uygulamadaki anlamı: {r.existing.tr}</span>
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
        <button className="btn btn-primary" onClick={add} disabled={fresh.length === 0}>
          {fresh.length ? `${fresh.length} kelimeyi ekle` : 'Kelime ekle'}
        </button>
      </div>
    </div>
  );
}
