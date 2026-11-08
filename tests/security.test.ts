import { describe, expect, it } from 'vitest';
import { cleanText, safeUrl } from '../src/lib/security';

describe('input safety helpers', () => {
  it('removes control characters and trims text', () => { expect(cleanText('  hello\u0000 world  ')).toBe('hello world'); });
  it('enforces the configured text length', () => { expect(cleanText('abcdef', 3)).toBe('abc'); });
  it('accepts HTTPS URLs only', () => { expect(safeUrl('https://example.com/path')).toBe('https://example.com/path'); expect(safeUrl('javascript:alert(1)')).toBe(''); expect(safeUrl('http://example.com')).toBe(''); expect(safeUrl('not a URL')).toBe(''); });
});
