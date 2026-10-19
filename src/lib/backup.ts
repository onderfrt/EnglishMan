import { allUserImages, mergeUserImages } from './images';
import { parseProgress, type Progress } from './storage';

/** Yedek dosyası: ilerleme + kendi kelimeler + kullanıcının eklediği görseller. */
export function exportBackup(progress: Progress): string {
  return JSON.stringify({ ...progress, images: allUserImages() });
}

/** Yedeği okur; görselleri geri yükler ve ilerlemeyi döndürür. Görseller sığmazsa uyarı döner. */
export function importBackup(raw: string): { progress: Progress; warning?: string } {
  const { images, ...rest } = JSON.parse(raw) as Progress & { images?: Record<string, string> };
  const progress = parseProgress(JSON.stringify(rest));
  if (images && Object.keys(images).length && !mergeUserImages(images)) {
    return { progress, warning: 'Görseller depolama alanına sığmadı; kelimeler ve ilerleme geri yüklendi.' };
  }
  return { progress };
}
