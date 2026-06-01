import { describe, it, expect } from 'vitest';
import { suggestApis } from './search.js';

describe('search module', () => {
  it('provides suggestApis for google, bing, baidu', () => {
    expect(suggestApis.google).toBeDefined();
    expect(suggestApis.bing).toBeDefined();
    expect(suggestApis.baidu).toBeDefined();
  });

  it('google parser extracts suggestions', () => {
    const mock = ['query', ['result1', 'result2']];
    expect(suggestApis.google.parse(mock)).toEqual(['result1', 'result2']);
  });

  it('baidu parser extracts suggestions', () => {
    const mock = ['query', ['baidu1', 'baidu2']];
    expect(suggestApis.baidu.parse(mock)).toEqual(['baidu1', 'baidu2']);
  });
});
