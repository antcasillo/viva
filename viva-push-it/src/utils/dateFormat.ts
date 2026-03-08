/**
 * Formato date dd-mm-yyyy in tutto il sito
 */

/** Converte YYYY-MM-DD o Date in dd-mm-yyyy */
export function formatDate(date: string | Date): string {
  if (typeof date === 'string') {
    const [y, m, d] = date.split('-');
    if (y && m && d) return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
    return date;
  }
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

/** Converte dd-mm-yyyy in YYYY-MM-DD per storage/API */
export function parseDateToISO(str: string): string {
  const parts = str.split('-');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (d.length <= 2 && m.length <= 2 && y.length === 4) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return str;
}
