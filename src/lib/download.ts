/** Metni dosya olarak indirir (yedek, içe aktarma şablonu). */
export function downloadText(filename: string, text: string, type: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Adres hemen iptal edilirse bazı tarayıcılar indirmeyi başlatmaz.
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
