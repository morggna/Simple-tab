import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, it, expect, beforeEach } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainJsPath = join(__dirname, 'main.js');

const SAFE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAD0lEQVQ42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

function createBrowserSandbox() {
  const store = {};
  const groupsContainer = { _html: '' };
  const elements = new Map();

  const escapeText = (value) =>
    String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  Object.defineProperty(groupsContainer, 'innerHTML', {
    get() {
      return this._html;
    },
    set(value) {
      this._html = String(value);
    },
  });

  const noop = () => {};
  const emptyNodeList = { forEach: noop, length: 0 };

  const stubEl = () => ({
    addEventListener: noop,
    removeEventListener: noop,
    click: noop,
    value: '',
    textContent: '',
    innerHTML: '',
    src: '',
    style: {},
    classList: { add: noop, remove: noop, contains: () => false },
    parentElement: { classList: { add: noop }, textContent: '' },
    dataset: {},
    setAttribute: noop,
    getAttribute: () => null,
  });

  const document = {
    body: { style: {}, classList: { add: noop, remove: noop } },
    documentElement: {
      style: { setProperty: noop },
      classList: { add: noop, remove: noop },
      removeAttribute: noop,
    },
    createElement: () => {
      let text = '';
      return {
        set textContent(value) {
          text = value;
        },
        get textContent() {
          return text;
        },
        get innerHTML() {
          return escapeText(text);
        },
      };
    },
    addEventListener: noop,
    getElementById(id) {
      if (id === 'groupsContainer') return groupsContainer;
      if (!elements.has(id)) elements.set(id, stubEl());
      return elements.get(id);
    },
    querySelectorAll: () => emptyNodeList,
    querySelector: () => null,
  };

  const localStorage = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
  };

  return {
    console,
    setTimeout: () => 0,
    clearTimeout: noop,
    fetch: () => Promise.resolve({ ok: false, json: async () => ({}) }),
    JSON,
    URL,
    btoa: (s) => Buffer.from(s, 'utf8').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('utf8'),
    Image: class {
      set src(_v) {}
    },
    Blob: class {},
    FileReader: class {
      readAsDataURL() {}
      readAsText() {}
    },
    alert: noop,
    document,
    localStorage,
    groupsContainer,
    elements,
  };
}

function loadMainContext() {
  const sandbox = createBrowserSandbox();
  const code = readFileSync(mainJsPath, 'utf8');
  vm.runInNewContext(code, sandbox, { filename: mainJsPath });
  return sandbox;
}

describe('main.js renderGroups XSS regression', () => {
  let ctx;

  beforeEach(() => {
    ctx = loadMainContext();
  });

  it('does not emit executable HTML or unsafe URL attributes for malicious group/link values', () => {
    const maliciousIcon = '</span><img src=x onerror="alert(1)">';
    const maliciousName = '<script>alert("xss")</script>';
    const maliciousLinkName = '<svg onload="alert(1)"></svg>';
    const maliciousUrl = 'javascript:alert(1)';
    const maliciousCustomIcon =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>';

    ctx.data = {
      groups: [
        {
          name: maliciousName,
          icon: maliciousIcon,
          links: [
            {
              name: maliciousLinkName,
              url: maliciousUrl,
              customIcon: maliciousCustomIcon,
            },
            {
              name: 'Safe',
              url: 'https://example.com/safe',
              customIcon: SAFE_PNG,
            },
          ],
        },
      ],
      searchEngine: 'google',
      bgUrl: '',
      theme: 'light',
      opacityLight: 85,
      opacityDark: 85,
      webdav: { url: '', user: '', pass: '' },
    };

    ctx.editingGroupIndex = null;
    ctx.renderGroups();

    const html = ctx.groupsContainer.innerHTML;

    expect(html).not.toMatch(/<img\s+src=x/i);
    expect(html).not.toMatch(/<svg/i);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/href=["']javascript:/i);
    expect(html).not.toMatch(/data:image\/svg\+xml/i);
    expect(html).not.toMatch(/data:text\/html/i);

    expect(html).toContain('&lt;script&gt;alert("xss")&lt;/script&gt;');
    expect(html).toContain('&lt;svg onload="alert(1)"&gt;&lt;/svg&gt;');
    expect(html).toMatch(/href=["']https:\/\/example\.com\/safe["']/i);
    expect(html).toMatch(/src=["']data:image\/png;base64,/i);
  });

  it('does not preview unsafe custom icons when editing a link', () => {
    ctx.data = {
      groups: [
        {
          name: 'Group',
          icon: '⭐',
          links: [
            {
              name: 'Unsafe',
              url: 'https://example.com',
              customIcon:
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
            },
          ],
        },
      ],
      searchEngine: 'google',
      bgUrl: '',
      theme: 'light',
      opacityLight: 85,
      opacityDark: 85,
      webdav: { url: '', user: '', pass: '' },
    };

    ctx.openEditLinkModal(0, 0);

    expect(ctx.document.getElementById('customIconImg').src).toBe('');
    expect(ctx.document.getElementById('customIconStatus').textContent).toBe('图标已被过滤');
    expect(ctx.document.getElementById('customIconPreview').style.display).toBe('none');
  });

  it('moves a dragged link into another group at the target position', () => {
    ctx.data = {
      groups: [
        {
          name: 'Work',
          icon: '💻',
          links: [
            { name: 'Docs', url: 'https://docs.example.com' },
            { name: 'Repo', url: 'https://repo.example.com' },
          ],
        },
        {
          name: 'Read later',
          icon: '⭐',
          links: [
            { name: 'Article', url: 'https://article.example.com' },
            { name: 'Video', url: 'https://video.example.com' },
          ],
        },
      ],
      searchEngine: 'google',
      bgUrl: '',
      theme: 'light',
      opacityLight: 85,
      opacityDark: 85,
      webdav: { url: '', user: '', pass: '' },
    };

    expect(typeof ctx.moveLinkBetweenGroups).toBe('function');
    expect(ctx.moveLinkBetweenGroups(0, 1, 1, 1)).toBe(true);

    expect(ctx.data.groups[0].links).toEqual([{ name: 'Docs', url: 'https://docs.example.com' }]);
    expect(ctx.data.groups[1].links).toEqual([
      { name: 'Article', url: 'https://article.example.com' },
      { name: 'Repo', url: 'https://repo.example.com' },
      { name: 'Video', url: 'https://video.example.com' },
    ]);
  });

  it('appends a dragged link when dropped onto an empty group row', () => {
    ctx.data = {
      groups: [
        {
          name: 'Work',
          icon: '💻',
          links: [{ name: 'Docs', url: 'https://docs.example.com' }],
        },
        {
          name: 'Read later',
          icon: '⭐',
          links: [],
        },
      ],
      searchEngine: 'google',
      bgUrl: '',
      theme: 'light',
      opacityLight: 85,
      opacityDark: 85,
      webdav: { url: '', user: '', pass: '' },
    };

    expect(typeof ctx.moveLinkBetweenGroups).toBe('function');
    expect(ctx.moveLinkBetweenGroups(0, 0, 1)).toBe(true);

    expect(ctx.data.groups[0].links).toHaveLength(0);
    expect(ctx.data.groups[1].links).toEqual([{ name: 'Docs', url: 'https://docs.example.com' }]);
  });
});
