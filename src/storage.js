/**
 * storage.js - Data persistence, migration, and canonical JSON handling
 */

export const defaultData = {
  groups: [
    {
      name: '开发工具',
      icon: '💻',
      links: [
        { name: 'Github', url: 'https://github.com' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com' }
      ]
    },
    {
      name: '常用网站',
      icon: '⭐',
      links: [
        { name: 'YouTube', url: 'https://youtube.com' },
        { name: 'Bilibili', url: 'https://www.bilibili.com' }
      ]
    }
  ],
  searchEngine: 'google',
  bgUrl: '',
  theme: 'light',
  opacityLight: 85,
  opacityDark: 85,
  webdav: { url: '', user: '', pass: '' }
};

export function canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const parts = keys.map(key => JSON.stringify(key) + ':' + canonicalStringify(obj[key]));
  return '{' + parts.join(',') + '}';
}

export function loadData() {
  let data = null;
  try {
    const cachedStr = localStorage.getItem('newtabData');
    if (cachedStr) {
      data = JSON.parse(cachedStr);
    }
  } catch (e) {}

  if (!data) {
    data = JSON.parse(JSON.stringify(defaultData));
  }

  // Ensure compatibility fields
  if (typeof data.theme === 'undefined') {
    data.theme = localStorage.getItem('theme') || 'light';
  }
  if (typeof data.opacityLight === 'undefined') data.opacityLight = 85;
  if (typeof data.opacityDark === 'undefined') data.opacityDark = 85;

  if (!data.webdav) {
    const oldConfig = localStorage.getItem('webdavConfig');
    if (oldConfig) {
      try {
        data.webdav = JSON.parse(oldConfig);
      } catch (e) {
        data.webdav = { url: '', user: '', pass: '' };
      }
    } else {
      data.webdav = { url: '', user: '', pass: '' };
    }
  }

  return data;
}

export function saveData(data) {
  try {
    localStorage.setItem('newtabData', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data', e);
  }
}
