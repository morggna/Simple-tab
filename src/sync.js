/**
 * sync.js - WebDAV auto-sync, conflict handling, status UI
 */

import { canonicalStringify, saveData } from './storage.js';

let syncModal = null;
let pendingRemoteData = null;
let currentDataRef = null; // reference to the live data object

export function initSync(dataRef) {
  currentDataRef = dataRef;
}

export function autoSyncToWebdav(data) {
  if (!data.webdav || !data.webdav.url) return;
  // debounce already handled by caller
  doWebdavSync(data, true);
}

export function doWebdavSync(data, silent = false) {
  if (!data.webdav || !data.webdav.url) {
    if (!silent) showWebdavStatus('请先配置 WebDAV', 'error');
    return;
  }

  const statusEl = document.getElementById('webdavStatus');
  if (!silent && statusEl) statusEl.textContent = '同步中...';

  const auth = btoa(`${data.webdav.user}:${data.webdav.pass}`);
  const headers = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json'
  };

  fetch(data.webdav.url, { method: 'GET', headers })
    .then(res => {
      if (!res.ok && res.status !== 404) throw new Error('下载失败');
      return res.status === 404 ? null : res.text();
    })
    .then(remoteText => {
      const localStr = canonicalStringify(data);
      const remoteData = remoteText ? JSON.parse(remoteText) : null;
      const remoteStr = remoteData ? canonicalStringify(remoteData) : null;

      if (remoteStr && remoteStr !== localStr) {
        if (!silent) showSyncPrompt(remoteData, data);
        else pendingRemoteData = remoteData;
      } else if (!silent) {
        showWebdavStatus('已同步', 'success');
      }
    })
    .catch(err => {
      if (!silent) showWebdavStatus('同步失败: ' + err.message, 'error');
    });
}

export function showSyncPrompt(remoteData, data) {
  syncModal = document.getElementById('syncModal');
  pendingRemoteData = remoteData;
  currentDataRef = data;
  syncModal.classList.add('active');

  document.getElementById('syncApplyRemote').onclick = () => applyRemoteData();
  document.getElementById('syncKeepLocal').onclick = () => keepLocalData();
}

export function applyRemoteData() {
  if (!pendingRemoteData || !currentDataRef) return;
  Object.assign(currentDataRef, pendingRemoteData);
  saveData(currentDataRef);
  location.reload();
}

export function keepLocalData() {
  if (!currentDataRef) return;
  syncModal.classList.remove('active');
  doWebdavSync(currentDataRef, true);
}

export function showWebdavStatus(msg, type = 'info') {
  const el = document.getElementById('webdavStatus');
  if (!el) return;
  el.textContent = msg;
  el.style.color = type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : 'var(--text-muted)';
  if (type === 'success') setTimeout(() => (el.textContent = ''), 2000);
}

/**
 * 启动时检查云端更新（原 main.js 中的 checkCloudSync）
 */
export function checkCloudSync() {
  if (!currentDataRef || !currentDataRef.webdav || !currentDataRef.webdav.url) return;
  // 静默检查
  doWebdavSync(currentDataRef, true);
}

// 暴露给 main.js
window.checkCloudSync = checkCloudSync;
