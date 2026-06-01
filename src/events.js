/**
 * events.js - All event binding, drag & drop, search, keyboard, modals
 */

import { saveData } from './storage.js';
import { searchEngines, suggestApis, checkHostPermission, requestHostPermission } from './search.js';
import { doSearch, setupSearchSuggestions } from './main.js'; // circular safe via re-export later

let dataRef = null;
let isEditMode = false;
let editingGroupIndex = null;
let suggestTimer = null;

export function initEvents(data) {
  dataRef = data;
  bindGlobalEvents();
  setupSearchSuggestions();
}

function bindGlobalEvents() {
  // Edit mode toggle
  const editBtn = document.getElementById('editBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      isEditMode = !isEditMode;
      editingGroupIndex = isEditMode ? 0 : null;
      document.body.classList.toggle('edit-mode', isEditMode);
      editBtn.textContent = isEditMode ? '完成' : '编辑';
      if (typeof window.renderGroups === 'function') window.renderGroups();
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      dataRef.theme = dataRef.theme === 'dark' ? 'light' : 'dark';
      saveData(dataRef);
      if (typeof window.applyThemeAndOpacity === 'function') window.applyThemeAndOpacity();
    });
  }

  // Settings modal
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      document.getElementById('settingsModal').classList.add('active');
    });
  }

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (typeof doSearch === 'function') doSearch();
      }
    });
  }

  // Keyboard "?" shortcut is handled in main.js for simplicity
}

export function setupDragAndDrop(groupIndex) {
  // (original drag-drop logic moved here in future iteration)
  // For now we keep the original implementation inside main.js to avoid breakage
}

export function setupGroupDragAndDrop() {
  // same as above
}
