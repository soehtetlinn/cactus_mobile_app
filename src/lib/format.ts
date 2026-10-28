// ERPNext sends dates as "YYYY-MM-DD" and datetimes as "YYYY-MM-DD HH:mm:ss" in the company's
// time zone (Asia/Bangkok). Phones in Thailand share that zone, so they are read as local time.

export function parseServerDate(value: string): Date {
  const [datePart, timePart = '00:00:00'] = value.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours || 0, minutes || 0, Math.floor(seconds || 0));
}

export function toServerDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function monthKey(date: Date): string {
  return toServerDate(date).slice(0, 7);
}

export function formatTime(value: string, locale: string): string {
  return parseServerDate(value).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(value: string | Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === 'string' ? parseServerDate(value) : value;
  return date.toLocaleDateString(locale, options ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonth(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function formatMoney(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatNumber(value: number, locale: string, digits = 1): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
}
