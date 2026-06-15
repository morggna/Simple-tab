/**
 * ui.js - Rendering, theme, background, groups, links, modals
 * (extracted from main.js during 2026-06-01 refactor)
 */

import { saveData } from './storage.js';
import { getIconUrl, getDomainName, escapeHtml } from './utils.js';

let dataRef = null;
let currentGroupIndex = null;
let currentLinkIndex = null;
let customIconBase64 = null;

export function initUI(data) {
  dataRef = data;
}

export function applyThemeAndOpacity() {
  const root = document.documentElement;
  const theme = dataRef.theme || 'light';
  root.setAttribute('data-theme', theme);

  const opacity =
    theme === 'dark' ? (dataRef.opacityDark ?? 85) / 100 : (dataRef.opacityLight ?? 85) / 100;

  root.style.setProperty('--opacity-light', opacity);
  root.style.setProperty('--opacity-dark', opacity);
}

export function applyBackground() {
  const body = document.body;
  if (dataRef.bgUrl) {
    body.style.backgroundImage = `url(${dataRef.bgUrl})`;
    body.classList.add('has-bg');
  } else {
    body.style.backgroundImage = '';
    body.classList.remove('has-bg');
  }
}

export function renderSearchEngine() {
  document.querySelectorAll('.search-engine').forEach((el) => {
    el.classList.toggle('active', el.dataset.engine === dataRef.searchEngine);
  });
}

export function renderGroups() {
  const container = document.getElementById('groupsContainer');
  if (!container) return;
  container.innerHTML = '';

  dataRef.groups.forEach((group, gIdx) => {
    const section = document.createElement('div');
    section.className = 'group-section';
    section.dataset.groupIndex = gIdx;

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <div class="group-title">
        <span class="group-icon">${group.icon}</span>
        <span class="group-name">${escapeHtml(group.name)}</span>
      </div>
      <div class="group-actions">
        <button class="icon-btn edit-group-btn" data-group="${gIdx}">✎</button>
        <button class="icon-btn add-link-btn" data-group="${gIdx}">+</button>
        <button class="icon-btn delete-group-btn" data-group="${gIdx}">×</button>
      </div>
    `;
    section.appendChild(header);

    const linksRow = document.createElement('div');
    linksRow.className = 'links-row';
    linksRow.dataset.groupIndex = gIdx;

    group.links.forEach((link, lIdx) => {
      const card = document.createElement('div');
      card.className = 'link-card';
      card.dataset.group = gIdx;
      card.dataset.link = lIdx;

      const iconUrl = link.customIcon || getIconUrl(link.url);
      card.innerHTML = `
        <div class="link-icon">
          <img src="${iconUrl}" onerror="this.style.display='none'">
        </div>
        <div class="link-name">${escapeHtml(link.name)}</div>
        <div class="link-actions">
          <button class="icon-btn edit-link-btn" data-group="${gIdx}" data-link="${lIdx}">✎</button>
          <button class="icon-btn delete-link-btn" data-group="${gIdx}" data-link="${lIdx}">×</button>
        </div>
      `;
      linksRow.appendChild(card);
    });

    section.appendChild(linksRow);
    container.appendChild(section);
  });

  // Re-bind drag and drop after render
  if (typeof window.setupDragAndDrop === 'function') {
    dataRef.groups.forEach((_, idx) => window.setupDragAndDrop(idx));
  }
  if (typeof window.setupGroupDragAndDrop === 'function') {
    window.setupGroupDragAndDrop();
  }
}

export function render() {
  applyThemeAndOpacity();
  applyBackground();
  renderSearchEngine();
  renderGroups();
}

export function openEditGroupModal(index) {
  currentGroupIndex = index;
  const group = dataRef.groups[index];
  document.getElementById('groupName').value = group.name;
  document.getElementById('groupIcon').value = group.icon;
  document.getElementById('groupModalTitle').textContent = '编辑分组';
  document.getElementById('groupModal').classList.add('active');
}

export function openLinkModal(groupIndex) {
  currentGroupIndex = groupIndex;
  currentLinkIndex = null;
  document.getElementById('linkUrl').value = '';
  document.getElementById('linkName').value = '';
  document.getElementById('linkPreview').style.display = 'none';
  document.getElementById('linkModalTitle').textContent = '添加链接';
  customIconBase64 = null;
  document.getElementById('customIconStatus').textContent = '未选择';
  document.getElementById('customIconPreview').style.display = 'none';
  document.getElementById('linkModal').classList.add('active');
  document.getElementById('linkUrl').focus();
}

export function openEditLinkModal(gIdx, lIdx) {
  currentGroupIndex = gIdx;
  currentLinkIndex = lIdx;
  const link = dataRef.groups[gIdx].links[lIdx];
  document.getElementById('linkUrl').value = link.url;
  document.getElementById('linkName').value = link.name;
  document.getElementById('linkModalTitle').textContent = '编辑链接';

  const iconUrl = link.customIcon || getIconUrl(link.url);
  if (iconUrl) {
    document.getElementById('linkPreviewIcon').src = iconUrl;
    document.getElementById('linkPreviewDomain').textContent = getDomainName(link.url);
    document.getElementById('linkPreview').style.display = 'flex';
  }
  if (link.customIcon) {
    customIconBase64 = link.customIcon;
    document.getElementById('customIconStatus').textContent = '已设置';
    document.getElementById('customIconImg').src = link.customIcon;
    document.getElementById('customIconPreview').style.display = 'block';
  } else {
    customIconBase64 = null;
    document.getElementById('customIconStatus').textContent = '未选择';
    document.getElementById('customIconPreview').style.display = 'none';
  }
  document.getElementById('linkModal').classList.add('active');
}

export function closeLinkModal() {
  document.getElementById('linkModal').classList.remove('active');
  currentGroupIndex = null;
  currentLinkIndex = null;
}

export function saveLink() {
  const url = document.getElementById('linkUrl').value.trim();
  const name = document.getElementById('linkName').value.trim();
  if (!url) return;

  const finalUrl = url.startsWith('http') ? url : 'https://' + url;
  const finalName = name || getDomainName(finalUrl);

  if (currentLinkIndex !== null) {
    const l = dataRef.groups[currentGroupIndex].links[currentLinkIndex];
    l.name = finalName;
    l.url = finalUrl;
    if (customIconBase64) l.customIcon = customIconBase64;
    else delete l.customIcon;
  } else {
    const nl = { name: finalName, url: finalUrl };
    if (customIconBase64) nl.customIcon = customIconBase64;
    dataRef.groups[currentGroupIndex].links.push(nl);
  }

  saveData(dataRef);
  render();
  closeLinkModal();
}

export function openGroupModal() {
  currentGroupIndex = null;
  document.getElementById('groupName').value = '';
  document.getElementById('groupIcon').value = '';
  document.getElementById('groupModalTitle').textContent = '添加分组';
  document.getElementById('groupModal').classList.add('active');
  document.getElementById('groupName').focus();
}

export function closeGroupModal() {
  document.getElementById('groupModal').classList.remove('active');
}

export function saveGroup() {
  const name = document.getElementById('groupName').value.trim();
  const icon = document.getElementById('groupIcon').value.trim() || '📁';
  if (!name) return;

  if (currentGroupIndex !== null) {
    dataRef.groups[currentGroupIndex].name = name;
    dataRef.groups[currentGroupIndex].icon = icon;
  } else {
    dataRef.groups.push({ name, icon, links: [] });
  }

  saveData(dataRef);
  render();
  closeGroupModal();
}
