import { useState } from 'react';
import { deleteAccount, signOut, syncNow, useSync } from '../lib/sync/engine';

/** Ayarlar'daki hesap kartı: giriş durumu, eşitleme, çıkış ve hesabı silme. */
export function AccountCard({ onLogin, now }: { onLogin: () => void; now: number }) {
  const { configured, user, status, lastSync, error } = useSync();
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!configured) return null;

  if (!user) {
    return (
      <div className="card account-card">
        <h3>☁️ Hesap</h3>
        <p className="muted small">
          Hesap oluşturursan kelimelerin, ilerlemen ve fotoğrafların telefonunda ve bilgisayarında aynı olur.
        </p>
        <button className="btn btn-primary btn-block" onClick={onLogin}>
          Giriş yap / Hesap oluştur
        </button>
      </div>
    );
  }

  const ago = lastSync ? Math.max(0, Math.round((now - lastSync) / 60000)) : null;
  const statusText = {
    'signed-out': '',
    syncing: '⟳ Eşitleniyor…',
    synced: `✅ Eşitlendi${ago === null ? '' : ago < 1 ? ' · az önce' : ` · ${ago} dk önce`}`,
    offline: '📴 İnternet yok; bağlantı gelince eşitlenecek',
    error: `⚠️ Eşitlenemedi: ${error ?? ''}`,
  }[status];

  const out = async (clearDevice: boolean) => {
    setBusy(true);
    try {
      await signOut(clearDevice);
    } finally {
      setBusy(false);
      setLeaving(false);
    }
  };

  return (
    <div className="card account-card">
      <h3>☁️ Hesap</h3>
      <p>
        <b>{user.email}</b>
      </p>
      <p className="small">{statusText}</p>
      {leaving ? (
        <div className="leave-panel">
          <p className="small">Çıkış yapıyorsun. Verilerin hesabında kayıtlı kalır. Bu cihazda da kalsın mı?</p>
          <button className="btn btn-block" disabled={busy} onClick={() => out(false)}>
            Çıkış yap, bu cihazda kalsın
          </button>
          <button className="btn btn-danger btn-block" disabled={busy} onClick={() => out(true)}>
            Çıkış yap ve bu cihazdan sil (ortak cihazlar için)
          </button>
          <button className="link-btn" onClick={() => setLeaving(false)}>
            Vazgeç
          </button>
        </div>
      ) : (
        <div className="row">
          <button className="btn" onClick={() => void syncNow()} disabled={status === 'syncing'}>
            ⟳ Şimdi eşitle
          </button>
          <button className="btn" onClick={() => setLeaving(true)}>
            Çıkış yap
          </button>
        </div>
      )}
      <details className="danger-zone">
        <summary className="small muted">Hesabı sil</summary>
        <p className="small muted">
          Hesabın ve sunucudaki tüm verilerin kalıcı olarak silinir. Bu cihazdaki veriler hesapsız kullanım için kalır.
        </p>
        <button
          className="btn btn-danger"
          disabled={busy}
          onClick={async () => {
            if (!confirm('Hesabın ve sunucudaki tüm verilerin kalıcı olarak silinecek. Emin misin?')) return;
            setBusy(true);
            try {
              await deleteAccount();
            } catch (e) {
              alert(e instanceof Error ? e.message : String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          🗑️ Hesabımı kalıcı olarak sil
        </button>
      </details>
    </div>
  );
}
