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

/** Mirrors intended safe-url policy for preloader onload simulation only. */
function isSafeBgUrlForPreload(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^javascript:/i.test(trimmed)) return false;
  if (/^vbscript:/i.test(trimmed)) return false;
  if (/^data:text\/html/i.test(trimmed)) return false;
  if (/^data:image\/svg\+xml/i.test(trimmed)) return false;
  if (/javascript:/i.test(trimmed) || /vbscript:/i.test(trimmed)) return false;
  if (/["')];|\/\*|\*\//.test(trimmed)) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(trimmed)) return true;
  return false;
}

function createBrowserSandbox() {
  const store = {};
  const groupsContainer = { _html: '' };
  const imageSrcAssignments = [];

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

  const bodyClasses = new Set();
  const body = {
    style: { backgroundImage: '' },
    classList: {
      add(name) {
        bodyClasses.add(name);
      },
      remove(name) {
        bodyClasses.delete(name);
      },
      contains(name) {
        return bodyClasses.has(name);
      },
    },
  };

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
    body,
    documentElement: {
      style: { setProperty: noop },
      classList: { add: noop, remove: noop },
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
      return stubEl();
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

  class MockImage {
    constructor() {
      this._src = '';
      this.onload = null;
      this.onerror = null;
    }

    set src(value) {
      const next = String(value);
      this._src = next;
      imageSrcAssignments.push(next);
      if (isSafeBgUrlForPreload(next) && typeof this.onload === 'function') {
        this.onload();
      }
    }

    get src() {
      return this._src;
    }
  }

  return {
    console,
    setTimeout: () => 0,
    clearTimeout: noop,
    fetch: () => Promise.resolve({ ok: false, json: async () => ({}) }),
    JSON,
    URL,
    btoa: (s) => Buffer.from(s, 'utf8').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('utf8'),
    Image: MockImage,
    Blob: class {},
    FileReader: class {
      readAsDataURL() {}
      readAsText() {}
    },
    alert: noop,
    document,
    localStorage,
    groupsContainer,
    imageSrcAssignments,
    bodyClasses,
  };
}

function loadMainContext() {
  const sandbox = createBrowserSandbox();
  const code = readFileSync(mainJsPath, 'utf8');
  vm.runInNewContext(code, sandbox, { filename: mainJsPath });
  return sandbox;
}

function expectNoUnsafeBackground(ctx, unsafeValue) {
  expect(ctx.imageSrcAssignments).not.toContain(unsafeValue);
  const bg = ctx.document.body.style.backgroundImage || '';
  expect(bg).not.toMatch(/javascript:/i);
  expect(bg).not.toMatch(/vbscript:/i);
  expect(bg).not.toMatch(/data:text\/html/i);
  expect(bg).not.toMatch(/data:image\/svg\+xml/i);
  if (/^javascript:|^vbscript:|^data:text\/html|^data:image\/svg\+xml/i.test(unsafeValue)) {
    expect(bg).toBe('');
  }
}

describe('main.js applyBackground URL safety regression', () => {
  let ctx;

  beforeEach(() => {
    ctx = loadMainContext();
    ctx.imageSrcAssignments.length = 0;
    ctx.bodyClasses.clear();
    ctx.document.body.style.backgroundImage = '';
  });

  it('preloads and applies a safe https background URL', () => {
    const safeUrl = 'https://example.com/wallpaper.jpg';
    ctx.data.bgUrl = safeUrl;
    ctx.applyBackground();

    expect(ctx.imageSrcAssignments).toContain(safeUrl);
    expect(ctx.document.body.style.backgroundImage).toBe(`url(${safeUrl})`);
    expect(ctx.document.body.classList.contains('has-bg')).toBe(true);
  });

  it('clears background and removes has-bg when bgUrl is empty', () => {
    ctx.data.bgUrl = 'https://example.com/wallpaper.jpg';
    ctx.applyBackground();
    expect(ctx.document.body.classList.contains('has-bg')).toBe(true);

    ctx.imageSrcAssignments.length = 0;
    ctx.data.bgUrl = '';
    ctx.applyBackground();

    expect(ctx.document.body.style.backgroundImage).toBe('');
    expect(ctx.document.body.classList.contains('has-bg')).toBe(false);
    expect(ctx.imageSrcAssignments).toHaveLength(0);
  });

  it('does not assign javascript: URLs to Image.src or backgroundImage', () => {
    const unsafe = 'javascript:alert(1)';
    ctx.data.bgUrl = unsafe;
    ctx.applyBackground();
    expectNoUnsafeBackground(ctx, unsafe);
  });

  it('does not assign vbscript: URLs to Image.src or backgroundImage', () => {
    const unsafe = 'vbscript:msgbox(1)';
    ctx.data.bgUrl = unsafe;
    ctx.applyBackground();
    expectNoUnsafeBackground(ctx, unsafe);
  });

  it('does not assign data:text/html URLs to Image.src or backgroundImage', () => {
    const unsafe = 'data:text/html,<script>alert(1)</script>';
    ctx.data.bgUrl = unsafe;
    ctx.applyBackground();
    expectNoUnsafeBackground(ctx, unsafe);
  });

  it('does not assign data:image/svg+xml URLs to Image.src or backgroundImage', () => {
    const unsafe = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>';
    ctx.data.bgUrl = unsafe;
    ctx.applyBackground();
    expectNoUnsafeBackground(ctx, unsafe);
  });

  it('does not apply CSS-breaking injected background URLs', () => {
    const unsafe = 'https://example.com/a.jpg");background-image:url(javascript:alert(1))/*';
    ctx.data.bgUrl = unsafe;
    ctx.applyBackground();
    expectNoUnsafeBackground(ctx, unsafe);
    expect(ctx.document.body.style.backgroundImage).not.toMatch(/url\(javascript:/i);
  });

  it('allows safe data:image/png base64 for preloading when policy permits', () => {
    ctx.data.bgUrl = SAFE_PNG;
    ctx.applyBackground();
    expect(ctx.imageSrcAssignments).toContain(SAFE_PNG);
    expect(ctx.document.body.style.backgroundImage).toBe(`url(${SAFE_PNG})`);
    expect(ctx.document.body.classList.contains('has-bg')).toBe(true);
  });
});
