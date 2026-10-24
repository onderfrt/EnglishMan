import { useSync } from '../lib/sync/engine';

/** Başlıktaki küçük hesap/eşitleme göstergesi. */
export function SyncBadge({ onClick }: { onClick: () => void }) {
  const { configured, ready, user, status } = useSync();
  if (!configured || !ready) return null;
  const [icon, label] = !user
    ? ['👤', 'Giriş yap']
    : status === 'syncing'
      ? ['⟳', 'Eşitleniyor']
      : status === 'synced'
        ? ['☁️', 'Eşitlendi']
        : status === 'offline'
          ? ['📴', 'Çevrimdışı']
          : ['⚠️', 'Eşitlenemedi'];
  return (
    <button className={`sync-badge sync-${user ? status : 'none'}`} onClick={onClick} title={label} aria-label={label}>
      <span aria-hidden>{icon}</span> {label}
    </button>
  );
}
