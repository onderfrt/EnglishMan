import { useEffect, useRef } from 'react';

/**
 * Uygulama içi "geri" yığını. Açılan her alt ekran (ayarlar, kelime görüntüleyici, form...) bir geri işleyicisi
 * kaydeder ve tarayıcı geçmişine bir kayıt ekler. Böylece hem ekrandaki "← Geri" butonu hem de telefonun kendi
 * geri tuşu / geri kaydırma hareketi uygulamadan çıkmak yerine bir önceki ekrana döner.
 */
const handlers: (() => void)[] = [];
let ignorePops = 0;

/**
 * Aynı anda açılan/kapanan ekranlar (ör. form kapanıp liste açılırken) geçmişi tek seferde günceller:
 * +1 yeni kayıt ekle, -1 kayıt geri al. Aynı anda olan bir açılış ve kapanış birbirini götürür.
 */
let delta = 0;
function changeHistory(d: number) {
  delta += d;
  if (delta === d) {
    queueMicrotask(() => {
      const n = delta;
      delta = 0;
      if (n > 0) for (let i = 0; i < n; i++) history.pushState({ englishman: true }, '');
      else if (n < 0) {
        ignorePops++;
        history.go(n);
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) {
      ignorePops--;
      return;
    }
    handlers.pop()?.();
  });
}

/** `active` olduğu sürece geri hareketi `onBack`i çağırır. */
export function useBack(active: boolean, onBack: () => void): void {
  const ref = useRef(onBack);
  ref.current = onBack;
  useEffect(() => {
    if (!active) return;
    const handler = () => ref.current();
    handlers.push(handler);
    changeHistory(1);
    return () => {
      const i = handlers.lastIndexOf(handler);
      // Ekran geri tuşuyla değil, uygulama içinden kapandıysa (ör. Kaydet) geçmiş kaydını da geri al.
      if (i >= 0) {
        handlers.splice(i, 1);
        changeHistory(-1);
      }
    };
  }, [active]);
}

/** Ekrandaki "← Geri" butonu: telefonun geri tuşuyla aynı işi yapar. */
export function goBack(): void {
  if (handlers.length) history.back();
}
