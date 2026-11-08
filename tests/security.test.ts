import { describe, expect, it } from 'vitest';
import { cleanText, safeUrl, isWebpImage } from '../src/lib/security';

describe('input safety helpers', () => {
  it('removes control characters and trims text', () => {
    expect(cleanText('  hello\u0000 world  ')).toBe('hello world');
  });
  it('preserves normal paragraph breaks', () => {
    expect(cleanText('first line\nsecond line')).toBe('first line\nsecond line');
  });
  it('enforces the configured text length', () => {
    expect(cleanText('abcdef', 3)).toBe('abc');
  });
  it('accepts HTTPS URLs only', () => {
    expect(safeUrl('https://example.com/path')).toBe('https://example.com/path');
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('http://example.com')).toBe('');
    expect(safeUrl('not a URL')).toBe('');
  });
  it('checks the WebP container signature instead of trusting a filename or MIME type', () => {
    const valid = new Uint8Array(30);
    valid.set([0x52,0x49,0x46,0x46],0);
    new DataView(valid.buffer).setUint32(4,22,true);
    valid.set([0x57,0x45,0x42,0x50],8);
    valid.set([0x56,0x50,0x38,0x58],12);
    new DataView(valid.buffer).setUint32(16,10,true);
    expect(isWebpImage(valid)).toBe(true);
    expect(isWebpImage(new Uint8Array(16))).toBe(false);
    expect(isWebpImage(valid.slice(0,12))).toBe(false);
    expect(isWebpImage(valid.slice(0,29))).toBe(false);
  });
});
