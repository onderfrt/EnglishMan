import { useEffect, useRef, useState } from 'react';
import { GOALS, LEVELS } from '../data/words';
import { autoVoiceName, canSpeak, englishVoices, onVoicesChanged, SLOW_RATE, speak } from '../lib/speech';
import { exportBackup, importBackup } from '../lib/backup';
import { AccountActions, AccountCard } from './AccountCard';
import { EmojiArt } from './EmojiArt';
import { downloadText } from '../lib/download';
import { emptyProgress, type Progress, type Settings, type Theme } from '../lib/storage';

const THEMES: [Theme, string][] = [
  ['system', 'Sistem'],
  ['light', 'Açık'],
  ['dark', 'Koyu'],
];

interface Props {
  progress: Progress;
  onChange: (p: Progress) => void;
  onChangeGoal: () => void;
  onChangeLevel: () => void;
  onLogin: () => void;
  onShowIntro: () => void;
  now: number;
}

export function SettingsView({ progress, onChange, onChangeGoal, onChangeLevel, onLogin, onShowIntro, now }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [voices, setVoices] = useState(englishVoices);
  useEffect(() => onVoicesChanged(() => setVoices(englishVoices())), []);
  const s = progress.settings;
  const set = (patch: Partial<Settings>) => onChange({ ...progress, settings: { ...s, ...patch } });

  const exportData = () =>
    downloadText(`englishman-yedek-${new Date().toISOString().slice(0, 10)}.json`, exportBackup(progress), 'application/json');

  const importData = async (file: File) => {
    try {
      const { progress: restored, warning } = importBackup(await file.text());
      onChange(restored);
      setMessage(warning ? `⚠️ ${warning}` : '✅ Yedek geri yüklendi.');
    } catch {
      setMessage('❌ Bu dosya geçerli bir EnglishMan yedeği değil.');
    }
  };

  const voiceName = s.voiceURI ? voices.find((v) => v.voiceURI === s.voiceURI)?.name : null;
  const shortName = (name: string) => name.replace(/^(Microsoft|Google)\s+/, '').replace(/\s+-\s+.*$/, '').replace(/\s*\(.*\)$/, '');

  return (
    <div className="settings">
      <AccountCard onLogin={onLogin} now={now} />

      <h4 className="group-title">Çalışma</h4>
      <div className="card list-card">
        <button className="list-row" onClick={onChangeGoal}>
          <span className="list-text">Hedef</span>
          <span className="list-value">
            {s.goal && (
              <>
                <EmojiArt emoji={GOALS[s.goal].emoji} /> {GOALS[s.goal].name}
              </>
            )}
          </span>
          <span className="chev">›</span>
        </button>
        {s.goal && GOALS[s.goal].pack ? (
          <label className="list-row">
            <span className="list-text">Sınav tarihi</span>
            <span className={`list-value ${s.examDate ? '' : 'accent'}`}>
              {s.examDate ? new Date(`${s.examDate}T12:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Seç'}
            </span>
            <span className="chev">›</span>
            <input
              type="date"
              className="overlay-input"
              value={s.examDate ?? ''}
              onChange={(e) => set({ examDate: e.target.value || null })}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {
                  // Bazı tarayıcılar showPicker'ı desteklemez; dokunmak zaten seçiciyi açar.
                }
              }}
              aria-label="Sınav tarihi"
            />
          </label>
        ) : (
          <button className="list-row" onClick={onChangeLevel}>
            <span className="list-text">Seviye</span>
            <span className="list-value">
              {s.level} · {s.level && LEVELS[s.level].name}
            </span>
            <span className="chev">›</span>
          </button>
        )}
        <div className="list-row">
          <span className="list-text">
            Günlük yeni kelime
            <span className="muted small">Başlangıç için 5–10 ideal</span>
          </span>
          <Stepper value={s.newPerDay} min={0} max={30} step={1} onChange={(v) => set({ newPerDay: v })} label="Günlük yeni kelime" />
        </div>
        <div className="list-row">
          <span className="list-text">Oturum başına tekrar</span>
          <Stepper value={s.maxReviewsPerSession} min={10} max={150} step={10} onChange={(v) => set({ maxReviewsPerSession: v })} label="Oturum başına tekrar" />
        </div>
      </div>

      <h4 className="group-title">Ses ve görünüm</h4>
      <div className="card list-card">
        <label className="list-row">
          <span className="list-text">Otomatik seslendir</span>
          <input type="checkbox" role="switch" className="switch" checked={s.autoSpeak} onChange={(e) => set({ autoSpeak: e.target.checked })} />
        </label>
        {canSpeak() ? (
          <div className="list-row">
            <label className="list-text voice-pick">
              <span>
                Ses · <span className="muted">{voiceName ? shortName(voiceName) : `Otomatik${autoVoiceName() ? ` (${shortName(autoVoiceName()!)})` : ''}`}</span>
              </span>
              <span className="small accent">Değiştir ▾</span>
              <select className="overlay-input" value={s.voiceURI ?? ''} onChange={(e) => set({ voiceURI: e.target.value || null })} aria-label="Ses">
                <option value="">Otomatik (yumuşak kadın sesi)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang}){v.localService ? '' : ' · internet'}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-sm" onClick={() => speak('Hello! This is how words will sound.')}>
              🔈 Dene
            </button>
            <button className="btn btn-sm" onClick={() => speak('Hello! This is how words will sound.', SLOW_RATE)}>
              🐢 Yavaş
            </button>
          </div>
        ) : (
          <p className="muted small list-row">Bu tarayıcı sesli okumayı desteklemiyor; dinleme soruları çalışmayabilir.</p>
        )}
        <div className="list-row">
          <div className="segmented" role="radiogroup" aria-label="Görünüm">
            {THEMES.map(([value, label]) => (
              <button
                key={value}
                role="radio"
                aria-checked={s.theme === value}
                className={s.theme === value ? 'active' : ''}
                onClick={() => set({ theme: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h4 className="group-title">Yardım</h4>
      <div className="card list-card">
        <button className="list-row" onClick={onShowIntro}>
          <span className="list-text">Uygulama tanıtımı</span>
          <span className="chev">›</span>
        </button>
      </div>

      <h4 className="group-title">Veri</h4>
      <div className="card list-card">
        <button className="list-row" onClick={exportData}>
          <span className="list-text">Yedeği dışa aktar</span>
          <span className="chev">›</span>
        </button>
        <button className="list-row" onClick={() => fileRef.current?.click()}>
          <span className="list-text">Yedekten içe aktar</span>
          <span className="chev">›</span>
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
        <button
          className="list-row danger"
          onClick={() => {
            if (confirm('Tüm ilerlemen silinecek (kendi kelimelerin kalır). Emin misin?'))
              onChange({ ...emptyProgress(), customWords: progress.customWords, settings: s });
          }}
        >
          <span className="list-text">İlerlemeyi sıfırla</span>
        </button>
        <AccountActions />
      </div>
      {message && <p className="small">{message}</p>}
      <p className="muted small center">
        İlerlemen, kendi kelimelerin ve görsellerin bu cihazda (giriş yaptıysan hesabında da) saklanır.
      </p>
    </div>
  );
}

function Stepper({ value, min, max, step, onChange, label }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string }) {
  return (
    <span className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label="Azalt">
        −
      </button>
      <b aria-live="polite">{value}</b>
      <button type="button" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label="Artır">
        +
      </button>
    </span>
  );
}
