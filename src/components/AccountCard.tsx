import { useState } from 'react';
import { deleteAccount, signOut, syncNow, useSync } from '../lib/sync/engine';

/** Profil'in üstündeki hesap kartı: e-posta, eşitleme durumu ve "Eşitle". */
export function AccountCard({ onLogin, now }: { onLogin: () => void; now: number }) {
  const { configured, user, status, lastSync, error } = useSync();
  if (!configured) return null;

  if (!user) {
    return (
      <div className="card account-card">
        <span className="avatar">👤</span>
        <span className="list-text">
          <b>Hesabın yok</b>
          <span className="muted small">Giriş yap, kelimelerin her cihazında olsun.</span>
        </span>
        <button className="btn btn-primary" onClick={onLogin}>
          Giriş yap
        </button>
      </div>
    );
  }

  const ago = lastSync ? Math.max(0, Math.round((now - lastSync) / 60000)) : null;
  const statusText = {
    'signed-out': '',
    syncing: '⟳ Eşitleniyor…',
    synced: `✓ Eşitlendi${ago === null ? '' : ago < 1 ? ' · az önce' : ` · ${ago} dk önce`}`,
    offline: '📴 İnternet yok; bağlantı gelince eşitlenecek',
    error: `⚠️ Eşitlenemedi: ${error ?? ''}`,
  }[status];

  return (
    <div className="card account-card">
      <span className="avatar">{user.email[0]?.toLocaleUpperCase('tr')}</span>
      <span className="list-text">
        <b className="ellipsis">{user.email}</b>
        <span className={`small sync-text sync-${status}`}>{statusText}</span>
      </span>
      <button className="btn" onClick={() => void syncNow()} disabled={status === 'syncing'}>
        Eşitle
      </button>
    </div>
  );
}

/** Profil > Veri grubundaki hesap satırları: çıkış (bu cihazda kalsın mı?) ve hesabı silme. */
export function AccountActions() {
  const { configured, user } = useSync();
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!configured || !user) return null;

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
    <>
      <button className="list-row" onClick={() => setLeaving(!leaving)}>
        <span className="list-text">Çıkış yap</span>
        <span className="chev">{leaving ? '˅' : '›'}</span>
      </button>
      {leaving && (
        <div className="leave-panel">
          <p className="small">Verilerin hesabında kayıtlı kalır. Bu cihazda da kalsın mı?</p>
          <button className="btn btn-block" disabled={busy} onClick={() => out(false)}>
            Çıkış yap, bu cihazda kalsın
          </button>
          <button className="btn btn-danger btn-block" disabled={busy} onClick={() => out(true)}>
            Çıkış yap ve bu cihazdan sil (ortak cihazlar için)
          </button>
        </div>
      )}
      <button
        className="list-row danger"
        disabled={busy}
        onClick={async () => {
          if (!confirm('Hesabın ve sunucudaki tüm verilerin kalıcı olarak silinecek. Bu cihazdaki veriler hesapsız kullanım için kalır. Emin misin?'))
            return;
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
        <span className="list-text">Hesabı sil</span>
      </button>
    </>
  );
}
