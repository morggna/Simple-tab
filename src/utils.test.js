import { describe, it, expect } from 'vitest';
import { getDomainName, getIconUrls, canonicalStringify } from './utils.js';

describe('utils', () => {
  it('getDomainName extracts hostname correctly', () => {
    expect(getDomainName('https://www.baidu.com/s?wd=test')).toBe('baidu.com');
    expect(getDomainName('github.com')).toBe('github.com');
  });

  it('getIconUrls returns Baidu special favicon', () => {
    const urls = getIconUrls('https://www.baidu.com');
    expect(urls.some(u => u.includes('baidu.com/favicon.ico'))).toBe(true);
  });

  it('canonicalStringify is stable for different key orders', () => {
    const a = { b: 2, a: 1, c: { d: 4, e: 5 } };
    const b = { a: 1, c: { e: 5, d: 4 }, b: 2 };
    expect(canonicalStringify(a)).toBe(canonicalStringify(b));
  });
});
