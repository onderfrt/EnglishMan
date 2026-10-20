import type { ReactNode } from 'react';
import { goBack } from '../lib/back';

/** Ana sayfa dışındaki ekranların üstündeki "← Geri" çubuğu. */
export function BackBar({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="back-bar">
      <button type="button" className="back-btn" onClick={goBack} aria-label="Geri">
        ← Geri
      </button>
      <h1>{title}</h1>
      <span className="back-bar-extra">{children}</span>
    </header>
  );
}
