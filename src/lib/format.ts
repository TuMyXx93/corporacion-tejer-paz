/**
 * Normalizes human-readable titles into URL-safe lowercase ASCII slugs.
 */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Formats Colombian telephone strings into standardized `tel:+57...` links.
 */
export function formatTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return 'tel:';
  if (digits.startsWith('57')) return `tel:+${digits}`;
  return `tel:+57${digits}`;
}

/**
 * Formats ISO date strings using Colombian Spanish short/medium conventions.
 */
export function formatDateTimeEs(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return isoDate;
    }
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return isoDate;
  }
}
