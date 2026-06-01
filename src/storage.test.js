import { describe, it, expect, beforeEach } from 'vitest';
import { defaultData, canonicalStringify, loadData, saveData } from './storage.js';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides sensible default data', () => {
    expect(defaultData.groups.length).toBeGreaterThan(0);
    expect(defaultData.searchEngine).toBe('google');
  });

  it('canonicalStringify produces stable output regardless of key order', () => {
    const a = { b: 2, a: 1 };
    const b = { a: 1, b: 2 };
    expect(canonicalStringify(a)).toBe(canonicalStringify(b));
  });

  it('loadData falls back to defaults when nothing is stored', () => {
    const data = loadData();
    expect(data.groups.length).toBeGreaterThan(0);
  });

  it('saveData + loadData round-trips correctly', () => {
    const testData = { ...defaultData, searchEngine: 'bing' };
    saveData(testData);
    const loaded = loadData();
    expect(loaded.searchEngine).toBe('bing');
  });
});
