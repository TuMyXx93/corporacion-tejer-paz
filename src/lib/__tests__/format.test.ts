import { describe, expect, it } from 'vitest';
import { formatDateTimeEs, formatTelHref, toSlug } from '@/lib/format';

describe('Shared Formatting & URL Helpers', () => {
  it('normalizes titles with accents, symbols, and whitespace into clean slugs', () => {
    expect(toSlug('Escuchar la voz de los jóvenes')).toBe(
      'escuchar-la-voz-de-los-jovenes'
    );
    expect(toSlug('  Diálogo & Paz — 2026!  ')).toBe('dialogo-paz-2026');
    expect(toSlug('Niñez y Cultura')).toBe('ninez-y-cultura');
    expect(toSlug('---')).toBe('');
  });

  it('formats Colombian phone numbers into consistent tel:+57 links', () => {
    expect(formatTelHref('301 3617133')).toBe('tel:+573013617133');
    expect(formatTelHref('+57 301-627-9744')).toBe('tel:+573016279744');
    expect(formatTelHref('573013617133')).toBe('tel:+573013617133');
    expect(formatTelHref('   ')).toBe('tel:');
  });

  it('formats valid ISO timestamps cleanly and returns raw input on invalid dates', () => {
    const formatted = formatDateTimeEs('2026-11-19T14:30:00.000Z');
    expect(formatted).toContain('2026');
    expect(formatDateTimeEs('not-a-valid-date')).toBe('not-a-valid-date');
  });
});
