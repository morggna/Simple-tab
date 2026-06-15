/**
 * search.js - Search engines, suggestion APIs, permission handling, UI rendering
 */

import { escapeHtml } from './utils.js';

export const searchEngines = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=' },
};

export const suggestApis = {
  google: {
    url: 'https://suggestqueries.google.com/complete/search?client=chrome&q=',
    origin: 'https://suggestqueries.google.com/*',
    parse: (data) => data[1] || [],
    encoding: 'utf-8',
  },
  bing: {
    url: 'https://api.bing.com/osjson.aspx?query=',
    origin: 'https://api.bing.com/*',
    parse: (data) => data[1] || [],
    encoding: 'utf-8',
  },
  baidu: {
    url: 'https://suggestion.baidu.com/su?action=opensearch&wd=',
    origin: 'https://suggestion.baidu.com/*',
    parse: (data) => data[1] || [],
    encoding: 'gbk',
  },
};

const suggestPermissionGranted = {};
let currentSuggestIndex = -1;
let currentSuggestions = [];

export function getOriginPattern(url) {
  try {
    const u = new URL(url);
    return u.origin + '/*';
  } catch {
    return url;
  }
}

export function checkHostPermission(callback, url) {
  if (!chrome.permissions) {
    callback(true);
    return;
  }
  const pattern = getOriginPattern(url);
  chrome.permissions.contains({ origins: [pattern] }, (granted) => callback(granted));
}

export function requestHostPermission(callback, url) {
  if (!chrome.permissions) {
    callback(true);
    return;
  }
  const pattern = getOriginPattern(url);
  chrome.permissions.request({ origins: [pattern] }, (granted) => callback(granted));
}

export function checkSuggestPermission(engine, callback) {
  if (!suggestApis[engine]) {
    callback(false);
    return;
  }
  const api = suggestApis[engine];
  checkHostPermission((granted) => {
    suggestPermissionGranted[engine] = granted;
    callback(granted);
  }, api.origin);
}

export function requestSuggestPermission(engine, callback) {
  if (!suggestApis[engine]) {
    callback(false);
    return;
  }
  const api = suggestApis[engine];
  requestHostPermission((granted) => {
    suggestPermissionGranted[engine] = granted;
    callback(granted);
  }, api.origin);
}

export function fetchSuggestions(query, engine) {
  if (!suggestApis[engine]) return;
  const api = suggestApis[engine];

  checkSuggestPermission(engine, (granted) => {
    if (!granted) return;

    const url = api.url + encodeURIComponent(query);
    fetch(url)
      .then((res) => {
        if (api.encoding === 'gbk') {
          return res.arrayBuffer().then((buf) => {
            const decoder = new TextDecoder('gbk');
            return JSON.parse(decoder.decode(buf));
          });
        }
        return res.json();
      })
      .then((data) => {
        const suggestions = api.parse(data);
        showSuggestions(suggestions);
      })
      .catch(() => {});
  });
}

export function showSuggestions(suggestions) {
  currentSuggestions = suggestions || [];
  currentSuggestIndex = -1;

  let box = document.getElementById('suggestBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'suggestBox';
    box.className = 'suggest-box';
    const searchBox = document.querySelector('.search-box');
    if (searchBox) searchBox.appendChild(box);
  }

  if (!currentSuggestions.length) {
    box.style.display = 'none';
    return;
  }

  box.innerHTML = currentSuggestions
    .map((s, i) => `<div class="suggest-item" data-index="${i}">${escapeHtml(s)}</div>`)
    .join('');
  box.style.display = 'block';

  box.querySelectorAll('.suggest-item').forEach((item) => {
    item.addEventListener('click', () => {
      const input = document.getElementById('searchInput');
      if (input) {
        input.value = item.textContent;
        if (typeof window.doSearch === 'function') window.doSearch();
      }
      box.style.display = 'none';
    });
  });
}

export function hideSuggestions() {
  const box = document.getElementById('suggestBox');
  if (box) box.style.display = 'none';
  currentSuggestions = [];
  currentSuggestIndex = -1;
}

// Keyboard navigation (browser only; skip at module load in Node/Vitest)
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', function (e) {
    const box = document.getElementById('suggestBox');
    if (!box || box.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentSuggestIndex = Math.min(currentSuggestIndex + 1, currentSuggestions.length - 1);
      highlightSuggestItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentSuggestIndex = Math.max(currentSuggestIndex - 1, 0);
      highlightSuggestItem();
    } else if (e.key === 'Enter' && currentSuggestIndex >= 0) {
      e.preventDefault();
      const input = document.getElementById('searchInput');
      if (input) {
        input.value = currentSuggestions[currentSuggestIndex];
        hideSuggestions();
        if (typeof window.doSearch === 'function') window.doSearch();
      }
    } else if (e.key === 'Escape') {
      hideSuggestions();
    }
  });
}

function highlightSuggestItem() {
  const items = document.querySelectorAll('#suggestBox .suggest-item');
  items.forEach((el, i) => el.classList.toggle('active', i === currentSuggestIndex));
}

// Legacy aliases for main.js compatibility
export { fetchSuggestions as doFetchSuggestions };
