import { useEffect, useRef, useState } from 'react';
import { GOALS, LEVELS } from '../data/words';
import { canSpeak, englishVoices, onVoicesChanged, SLOW_RATE, speak } from '../lib/speech';
import { emptyProgress, parseProgress, type Progress, type Settings } from '../lib/storage';

interface Props {
  progress: Progress;
  onChange: (p: Progress) => void;
  onChangeGoal: () => void;
  onChangeLevel: () => void;
}

export function SettingsView({ progress, onChange, onChangeGoal, onChangeLevel }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [voices, setVoices] = useState(englishVoices);
  useEffect(() => onVoicesChanged(() => setVoices(englishVoices())), []);
  const s = progress.settings;
  const set = (patch: Partial<Settings>) => onChange({ ...progress, settings: { ...s, ...patch } });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `englishman-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      onChange(parseProgress(await file.text()));
      setMessage('✅ Yedek geri yüklendi.');
    } catch {
      setMessage('❌ Bu dosya geçerli bir EnglishMan yedeği değil.');
    }
  };

  return (
    <div className="settings">
      <div className="card">
        <div className="setting setting-inline">
          <span>
            Hedef: <b>{s.goal && GOALS[s.goal].name}</b>
          </span>
          <button className="btn" onClick={onChangeGoal}>
            Değiştir
          </button>
        </div>
        {s.goal && GOALS[s.goal].pack ? (
          <label className="setting">
            <span>Sınav tarihi</span>
            <input
              type="date"
              className="search"
              value={s.examDate ?? ''}
              onChange={(e) => set({ examDate: e.target.value || null })}
            />
          </label>
        ) : (
          <div className="setting setting-inline">
            <span>
              Seviye: <b>{s.level}</b> — {s.level && LEVELS[s.level].name}
            </span>
            <button className="btn" onClick={onChangeLevel}>
              Değiştir
            </button>
          </div>
        )}
        <label className="setting">
          <span>
            Günlük yeni kelime: <b>{s.newPerDay}</b>
          </span>
          <input type="range" min={0} max={30} value={s.newPerDay} onChange={(e) => set({ newPerDay: Number(e.target.value) })} />
          <small className="muted">Başlangıç için 5–10 idealdir. Yeni kelimeler sonraki günlerde tekrar yükü getirir.</small>
        </label>
        <label className="setting">
          <span>
            Oturum başına en fazla tekrar: <b>{s.maxReviewsPerSession}</b>
          </span>
          <input
            type="range"
            min={10}
            max={150}
            step={10}
            value={s.maxReviewsPerSession}
            onChange={(e) => set({ maxReviewsPerSession: Number(e.target.value) })}
          />
        </label>
        <label className="setting setting-inline">
          <input type="checkbox" checked={s.autoSpeak} onChange={(e) => set({ autoSpeak: e.target.checked })} />
          <span>Kelimeleri otomatik seslendir</span>
        </label>
        {canSpeak() ? (
          <div className="setting">
            <label>
              <span>Ses</span>
              <select value={s.voiceURI ?? ''} onChange={(e) => set({ voiceURI: e.target.value || null })}>
                <option value="">Otomatik</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang}){v.localService ? '' : ' · internet'}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <button className="btn" onClick={() => speak('Hello! This is how words will sound.')}>
                🔊 Normal dene
              </button>
              <button className="btn" onClick={() => speak('Hello! This is how words will sound.', SLOW_RATE)}>
                🐢 Yavaş dene
              </button>
            </div>
            <small className="muted">
              Yavaş okuma hızlanmıyorsa farklı bir ses seç. “internet” yazan sesler bazı telefonlarda hız ayarını desteklemez.
            </small>
          </div>
        ) : (
          <p className="muted small">Bu tarayıcı sesli okumayı desteklemiyor; dinleme soruları çalışmayabilir.</p>
        )}
      </div>

      <div className="card">
        <h3>Yedekleme</h3>
        <p className="muted small">İlerlemen bu cihazın tarayıcısında saklanır. Başka cihaza taşımak ya da yedeklemek için dışa aktar.</p>
        <div className="row">
          <button className="btn" onClick={exportData}>
            ⬇️ Dışa aktar
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            ⬆️ İçe aktar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = '';
            }}
          />
        </div>
        {message && <p className="small">{message}</p>}
      </div>

      <div className="card">
        <h3>Sıfırla</h3>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm('Tüm ilerlemen silinecek. Emin misin?')) onChange({ ...emptyProgress(), settings: s });
          }}
        >
          🗑️ İlerlemeyi sıfırla
        </button>
      </div>
    </div>
  );
}
