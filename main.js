// 默认数据
var defaultData = {
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

var data = null;
var currentGroupIndex = null;
var currentLinkIndex = null;
var urlInputTimer = null;
var customIconBase64 = null;

var searchEngines = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=' }
};

function canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  var keys = Object.keys(obj).sort();
  var parts = keys.map(function(key) {
    return JSON.stringify(key) + ':' + canonicalStringify(obj[key]);
  });
  return '{' + parts.join(',') + '}';
}

function getIconUrl(url, size) {
  try {
    var domain = new URL(url).hostname;
    return 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=' + (size || 64);
  } catch (e) { return null; }
}

function getDomainName(url) {
  try {
    var hostname = new URL(url).hostname.replace(/^www\./, '');
    var name = hostname.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch (e) { return 'Link'; }
}

function loadData() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['newtabData'], function(result) {
      initData(result.newtabData);
    });
  } else {
    var saved = localStorage.getItem('newtabData');
    initData(saved ? JSON.parse(saved) : null);
  }
}

function initData(loadedData) {
  if (loadedData) {
    data = loadedData;
    if (typeof data.theme === 'undefined') data.theme = localStorage.getItem('theme') || 'light';
    if (typeof data.opacityLight === 'undefined') data.opacityLight = localStorage.getItem('opacityLight') || 85;
    if (typeof data.opacityDark === 'undefined') data.opacityDark = localStorage.getItem('opacityDark') || 85;
    if (!data.webdav) {
      var oldConfig = localStorage.getItem('webdavConfig');
      if (oldConfig) {
        try { data.webdav = JSON.parse(oldConfig); } catch(e) { data.webdav = { url:'', user:'', pass:'' }; }
      } else {
        data.webdav = { url:'', user:'', pass:'' };
      }
    }
  } else {
    data = defaultData;
    var oldConfig = localStorage.getItem('webdavConfig');
    if (oldConfig) { try { data.webdav = JSON.parse(oldConfig); } catch(e) {} }
  }
  if (!data.webdav) data.webdav = { url:'', user:'', pass:'' };
  render();
  setTimeout(checkCloudSync, 500);
}

function saveData() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.set({ newtabData: data });
  } else {
    localStorage.setItem('newtabData', JSON.stringify(data));
  }
  localStorage.setItem('theme', data.theme);
  autoSyncToWebdav();
}

// 【关键修复】自动同步函数：增加了对UI状态文字的更新
function autoSyncToWebdav() {
  var cfg = data.webdav;
  if (!cfg || !cfg.url || !cfg.user) return;
  
  var fileUrl = cfg.url.replace(/\/$/, '') + '/newtab-config.json';
  var settingsBtn = document.getElementById('settingsBtn');
  var statusEl = document.getElementById('webdavStatus');
  
  // 返回 fetch Promise，虽然 saveData 不等待它，但这对代码健壮性有好处
  return fetch(fileUrl, {
    method: 'PUT',
    headers: {
      'Authorization': 'Basic ' + btoa(cfg.user + ':' + cfg.pass),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data, null, 2)
  })
  .then(function(response) {
    if (response.ok || response.status === 201 || response.status === 204) {
      console.log('自动同步成功');
      
      // 1. 更新右上角齿轮颜色 (静默反馈)
      if(settingsBtn) {
        settingsBtn.style.color = '#27ae60';
        setTimeout(function() { settingsBtn.style.color = ''; }, 1500);
      }

      // 2. 【新增】更新设置面板里的状态文字 (解决“卡住”的假象)
      if (statusEl) {
        showWebdavStatus('同步成功 ✓', 'success');
        // 3秒后清除成功提示，保持界面整洁
        setTimeout(function() { 
          if(statusEl.textContent.includes('成功')) statusEl.textContent = ''; 
        }, 3000);
      }

    } else {
        throw new Error('HTTP ' + response.status);
    }
  })
  .catch(function(err) {
    console.error('自动同步失败', err);
    
    // 失败反馈
    if(settingsBtn) {
        settingsBtn.style.color = '#e74c3c';
        setTimeout(function() { settingsBtn.style.color = ''; }, 3000);
    }
    // 失败时必须显示错误信息，并且不要自动消失
    showWebdavStatus('同步失败: ' + err.message, 'error');
  });
}

function checkCloudSync() {
  var cfg = data.webdav;
  if (!cfg || !cfg.url || !cfg.user) return;
  
  var fileUrl = cfg.url.replace(/\/$/, '') + '/newtab-config.json';
  
  fetch(fileUrl, {
    method: 'GET',
    headers: { 'Authorization': 'Basic ' + btoa(cfg.user + ':' + cfg.pass) }
  })
  .then(function(response) {
    if (!response.ok) return null;
    return response.json();
  })
  .then(function(remoteData) {
    if (!remoteData || !remoteData.groups) return;
    
    var localStr = canonicalStringify(data);
    var remoteStr = canonicalStringify(remoteData);
    
    if (localStr !== remoteStr) {
      showSyncPrompt(remoteData);
    }
  })
  .catch(function(err) {
    console.warn('检查同步出错:', err);
  });
}

function showSyncPrompt(remoteData) {
  var modal = document.getElementById('syncModal');
  if (modal) {
    window.pendingRemoteData = remoteData;
    modal.classList.add('active');
  }
}

function applyRemoteData() {
  if (window.pendingRemoteData) {
    var remote = window.pendingRemoteData;
    if ((!remote.webdav || !remote.webdav.url) && data.webdav && data.webdav.url) {
      remote.webdav = data.webdav;
    }
    if (typeof remote.theme === 'undefined') remote.theme = 'light';
    data = remote;
    saveData();
    render();
    window.pendingRemoteData = null;
  }
  document.getElementById('syncModal').classList.remove('active');
}

function keepLocalData() {
  window.pendingRemoteData = null;
  document.getElementById('syncModal').classList.remove('active');
  console.log('保留本地，强制覆盖云端...');
  autoSyncToWebdav(); 
}

function render() {
  renderGroups();
  renderSearchEngine();
  applyBackground();
  applyThemeAndOpacity();
}

function applyThemeAndOpacity() {
  if (data.theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('themeToggle').textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('themeToggle').textContent = '🌙';
  }
  var opL = (data.opacityLight || 85) / 100;
  var opD = (data.opacityDark || 85) / 100;
  document.documentElement.style.setProperty('--opacity-light', opL);
  document.documentElement.style.setProperty('--opacity-dark', opD);

  var elL = document.getElementById('opacityLight');
  var elD = document.getElementById('opacityDark');
  if (elL) { elL.value = data.opacityLight || 85; document.getElementById('opacityLightVal').textContent = elL.value + '%'; }
  if (elD) { elD.value = data.opacityDark || 85; document.getElementById('opacityDarkVal').textContent = elD.value + '%'; }
}

function applyBackground() {
  if (data.bgUrl) {
    var img = new Image();
    img.onload = function() {
      document.body.style.backgroundImage = 'url(' + data.bgUrl + ')';
      document.body.classList.add('has-bg');
    };
    img.src = data.bgUrl;
  } else {
    document.body.style.backgroundImage = '';
    document.body.classList.remove('has-bg');
  }
}

function renderSearchEngine() {
  var engines = document.querySelectorAll('.search-engine');
  engines.forEach(function(el) {
    var engine = el.getAttribute('data-engine');
    if (engine === data.searchEngine) el.classList.add('active');
    else el.classList.remove('active');
  });
  var placeholder = '使用 ' + searchEngines[data.searchEngine].name + ' 搜索...';
  document.getElementById('searchInput').placeholder = placeholder;
}

function renderGroups() {
  var container = document.getElementById('groupsContainer');
  var html = '';

  data.groups.forEach(function(group, groupIndex) {
    html += '<div class="group-section" data-group-index="' + groupIndex + '" draggable="false">';
    html += '<div class="group-header">';
    html += '<div class="group-indicator"></div>';
    html += '<span class="group-icon">' + group.icon + '</span>';
    html += '<span class="group-name">' + group.name + '</span>';
    html += '<button class="group-edit-icon" data-index="' + groupIndex + '" title="编辑分组">✎</button>';
    html += '<div class="group-actions">';
    var isEditing = editingGroupIndex === groupIndex;
    var editBtnClass = isEditing ? 'group-action-btn edit-group-btn editing' : 'group-action-btn edit-group-btn';
    var editBtnText = isEditing ? '完成' : '编辑';
    html += '<button class="' + editBtnClass + '" data-index="' + groupIndex + '">' + editBtnText + '</button>';
    html += '<button class="group-action-btn delete-group-btn" data-index="' + groupIndex + '">删除</button>';
    html += '</div>';
    html += '</div>';
    html += '<div class="links-row" data-group-index="' + groupIndex + '">';

    group.links.forEach(function(link, linkIndex) {
      var iconUrl = link.customIcon || getIconUrl(link.url);
      html += '<a href="' + link.url + '" class="link-card" data-group="' + groupIndex + '" data-link="' + linkIndex + '">';
      html += '<div class="link-icon">';
      if (iconUrl) {
        html += '<img src="' + iconUrl + '" onerror="this.parentElement.classList.add(\'fallback\');this.style.display=\'none\';this.parentElement.textContent=\'' + (link.name ? link.name[0] : 'L') + '\'">';
      } else {
        html += link.name[0];
      }
      html += '</div>';
      html += '<span class="link-name">' + link.name + '</span>';
      html += '<button class="link-edit-icon" data-group="' + groupIndex + '" data-link="' + linkIndex + '" title="编辑链接">✎</button>';
      html += '<button class="link-delete" data-group="' + groupIndex + '" data-link="' + linkIndex + '">&times;</button>';
      html += '</a>';
    });

    html += '<button class="add-link-btn" data-group-index="' + groupIndex + '">+</button>';
    html += '</div>';
    html += '</div>';
  });

  container.innerHTML = html;
  bindEvents();
}

var isEditMode = false;
var editingGroupIndex = null;

function bindEvents() {
  document.querySelectorAll('.add-link-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      currentGroupIndex = parseInt(this.getAttribute('data-group-index'));
      openLinkModal();
    });
  });
  document.querySelectorAll('.link-edit-icon').forEach(function(icon) {
    icon.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      openEditLinkModal(parseInt(this.getAttribute('data-group')), parseInt(this.getAttribute('data-link')));
    });
  });
  document.querySelectorAll('.link-delete').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      data.groups[parseInt(this.getAttribute('data-group'))].links.splice(parseInt(this.getAttribute('data-link')), 1);
      saveData(); renderGroups();
    });
  });
  document.querySelectorAll('.edit-group-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var index = parseInt(this.getAttribute('data-index'));
      if (editingGroupIndex === index) { editingGroupIndex = null; isEditMode = false; }
      else { editingGroupIndex = index; isEditMode = true; }
      renderGroups();
    });
  });
  document.querySelectorAll('.group-edit-icon').forEach(function(icon) {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      openEditGroupModal(parseInt(this.getAttribute('data-index')));
    });
  });
  document.querySelectorAll('.delete-group-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var index = parseInt(this.getAttribute('data-index'));
      if (confirm('确定删除分组 "' + data.groups[index].name + '"?')) {
        data.groups.splice(index, 1);
        editingGroupIndex = null; isEditMode = false;
        saveData(); renderGroups();
      }
    });
  });
  if (editingGroupIndex !== null) {
    var editingSection = document.querySelector('.group-section[data-group-index="' + editingGroupIndex + '"]');
    if (editingSection) {
      editingSection.classList.add('editing');
      setupDragAndDrop(editingGroupIndex);
      setupGroupDragAndDrop();
    }
  }
}

function setupDragAndDrop(groupIndex) { var linksRow = document.querySelector('.links-row[data-group-index="' + groupIndex + '"]'); if (!linksRow) return; var linkCards = linksRow.querySelectorAll('.link-card'); linkCards.forEach(function(card) { card.setAttribute('draggable', 'true'); card.addEventListener('click', function(e) { if (editingGroupIndex !== null) { e.preventDefault(); } }); card.addEventListener('dragstart', function(e) { if (editingGroupIndex === null) { e.preventDefault(); return; } this.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', JSON.stringify({ groupIndex: this.getAttribute('data-group'), linkIndex: this.getAttribute('data-link') })); }); card.addEventListener('dragend', function() { this.classList.remove('dragging'); document.querySelectorAll('.link-card').forEach(function(c) { c.classList.remove('drag-over'); }); }); card.addEventListener('dragover', function(e) { if (editingGroupIndex === null) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; this.classList.add('drag-over'); }); card.addEventListener('dragleave', function() { this.classList.remove('drag-over'); }); card.addEventListener('drop', function(e) { if (editingGroupIndex === null) return; e.preventDefault(); this.classList.remove('drag-over'); var sourceData = JSON.parse(e.dataTransfer.getData('text/plain')); var targetGroupIndex = parseInt(this.getAttribute('data-group')); var targetLinkIndex = parseInt(this.getAttribute('data-link')); var sourceGroupIndex = parseInt(sourceData.groupIndex); var sourceLinkIndex = parseInt(sourceData.linkIndex); if (sourceGroupIndex === targetGroupIndex && sourceLinkIndex === targetLinkIndex) { return; } if (sourceGroupIndex === targetGroupIndex) { var links = data.groups[sourceGroupIndex].links; var movedLink = links.splice(sourceLinkIndex, 1)[0]; links.splice(targetLinkIndex, 0, movedLink); saveData(); renderGroups(); } }); }); }
function setupGroupDragAndDrop() { var groupSections = document.querySelectorAll('.group-section'); groupSections.forEach(function(section) { var header = section.querySelector('.group-header'); section.setAttribute('draggable', 'true'); section.addEventListener('dragstart', function(e) { if (editingGroupIndex === null) { e.preventDefault(); return; } if (!e.target.classList.contains('group-section')) return; this.classList.add('dragging-group'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('application/group', this.getAttribute('data-group-index')); }); section.addEventListener('dragend', function() { this.classList.remove('dragging-group'); document.querySelectorAll('.group-section').forEach(function(s) { s.classList.remove('drag-over-group'); }); }); section.addEventListener('dragover', function(e) { if (editingGroupIndex === null) return; if (e.dataTransfer.types.includes('application/group')) { e.preventDefault(); this.classList.add('drag-over-group'); } }); section.addEventListener('dragleave', function() { this.classList.remove('drag-over-group'); }); section.addEventListener('drop', function(e) { if (editingGroupIndex === null) return; if (!e.dataTransfer.types.includes('application/group')) return; e.preventDefault(); this.classList.remove('drag-over-group'); var sourceIndex = parseInt(e.dataTransfer.getData('application/group')); var targetIndex = parseInt(this.getAttribute('data-group-index')); if (sourceIndex === targetIndex) return; var movedGroup = data.groups.splice(sourceIndex, 1)[0]; data.groups.splice(targetIndex, 0, movedGroup); if (editingGroupIndex === sourceIndex) { editingGroupIndex = targetIndex; } else if (sourceIndex < editingGroupIndex && targetIndex >= editingGroupIndex) { editingGroupIndex--; } else if (sourceIndex > editingGroupIndex && targetIndex <= editingGroupIndex) { editingGroupIndex++; } saveData(); renderGroups(); }); }); }
function setupUrlPreview(id1, id2, id3, id4) { var urlInput = document.getElementById(id1); var timer; urlInput.addEventListener('input', function() { clearTimeout(timer); var url = this.value.trim(); timer = setTimeout(function() { if (url && (url.startsWith('http') || url.includes('.'))) { if (!url.startsWith('http')) url = 'https://' + url; var iconUrl = getIconUrl(url); var domain = getDomainName(url); if (iconUrl) { document.getElementById(id3).src = iconUrl; document.getElementById(id4).textContent = domain; document.getElementById(id2).style.display = 'flex'; } } else { document.getElementById(id2).style.display = 'none'; } }, 300); }); }

function openLinkModal() { currentLinkIndex = null; document.getElementById('linkUrl').value = ''; document.getElementById('linkName').value = ''; document.getElementById('linkPreview').style.display = 'none'; document.getElementById('linkModalTitle').textContent = '添加链接'; customIconBase64 = null; document.getElementById('customIconStatus').textContent = '未选择'; document.getElementById('customIconPreview').style.display = 'none'; document.getElementById('linkModal').classList.add('active'); document.getElementById('linkUrl').focus(); }
function openEditLinkModal(gIdx, lIdx) { currentGroupIndex = gIdx; currentLinkIndex = lIdx; var link = data.groups[gIdx].links[lIdx]; document.getElementById('linkUrl').value = link.url; document.getElementById('linkName').value = link.name; document.getElementById('linkModalTitle').textContent = '编辑链接'; var iconUrl = link.customIcon || getIconUrl(link.url); if (iconUrl) { document.getElementById('linkPreviewIcon').src = iconUrl; document.getElementById('linkPreviewDomain').textContent = getDomainName(link.url); document.getElementById('linkPreview').style.display = 'flex'; } if (link.customIcon) { customIconBase64 = link.customIcon; document.getElementById('customIconStatus').textContent = '已设置'; document.getElementById('customIconImg').src = link.customIcon; document.getElementById('customIconPreview').style.display = 'block'; } else { customIconBase64 = null; document.getElementById('customIconStatus').textContent = '未选择'; document.getElementById('customIconPreview').style.display = 'none'; } document.getElementById('linkModal').classList.add('active'); }
function closeLinkModal() { document.getElementById('linkModal').classList.remove('active'); currentGroupIndex = null; }
function saveLink() { var url = document.getElementById('linkUrl').value.trim(); var name = document.getElementById('linkName').value.trim(); if (!url) return; if (!url.startsWith('http')) url = 'https://' + url; if (!name) name = getDomainName(url); if (currentLinkIndex !== null) { var l = data.groups[currentGroupIndex].links[currentLinkIndex]; l.name = name; l.url = url; if (customIconBase64) l.customIcon = customIconBase64; else delete l.customIcon; } else { var nl = {name:name, url:url}; if (customIconBase64) nl.customIcon = customIconBase64; data.groups[currentGroupIndex].links.push(nl); } saveData(); render(); closeLinkModal(); }
function openGroupModal() { currentGroupIndex = null; document.getElementById('groupName').value = ''; document.getElementById('groupIcon').value = ''; document.getElementById('groupModalTitle').textContent = '添加分组'; document.getElementById('groupModal').classList.add('active'); document.getElementById('groupName').focus(); }
function closeGroupModal() { document.getElementById('groupModal').classList.remove('active'); }
function saveGroup() { var name = document.getElementById('groupName').value.trim(); var icon = document.getElementById('groupIcon').value.trim() || '📁'; if (!name) return; if (currentGroupIndex !== null) { data.groups[currentGroupIndex].name = name; data.groups[currentGroupIndex].icon = icon; } else { data.groups.push({name:name, icon:icon, links:[]}); } saveData(); render(); closeGroupModal(); }
function doSearch() { var q = document.getElementById('searchInput').value.trim(); if (!q) return; window.location.href = searchEngines[data.searchEngine].url + encodeURIComponent(q); }

function saveWebdavConfig() {
  data.webdav.url = document.getElementById('webdavUrl').value.trim();
  data.webdav.user = document.getElementById('webdavUser').value.trim();
  data.webdav.pass = document.getElementById('webdavPass').value;
  showWebdavStatus('配置已更新，正在同步...', 'info');
  saveData();
}

function showWebdavStatus(msg, type) {
  var el = document.getElementById('webdavStatus');
  el.textContent = msg;
  el.style.color = type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : 'var(--text-muted)';
}

function webdavUpload() {
  var cfg = data.webdav;
  if (!cfg.url) { showWebdavStatus('请先保存 WebDAV 设置', 'error'); return; }
  showWebdavStatus('上传中...', 'info');
  autoSyncToWebdav(); 
}

function webdavDownload() {
  var cfg = data.webdav;
  if (!cfg.url) { showWebdavStatus('请先保存 WebDAV 设置', 'error'); return; }
  showWebdavStatus('下载中...', 'info');
  var fileUrl = cfg.url.replace(/\/$/, '') + '/newtab-config.json';
  fetch(fileUrl, {
    method: 'GET',
    headers: { 'Authorization': 'Basic ' + btoa(cfg.user + ':' + cfg.pass) }
  }).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => {
       if(d.groups) { 
         if((!d.webdav || !d.webdav.url) && data.webdav && data.webdav.url) {
            d.webdav = data.webdav;
         }
         initData(d); 
         saveData(); 
         showWebdavStatus('下载成功 ✓', 'success'); 
       }
    }).catch(e => showWebdavStatus('失败: ' + e.message, 'error'));
}

function exportData() {
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'newtab-config.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData() { document.getElementById('importFile').click(); }

function handleImport(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var imported = JSON.parse(e.target.result);
      if (imported.groups) {
        if((!imported.webdav || !imported.webdav.url) && data.webdav && data.webdav.url) {
            imported.webdav = data.webdav;
        }
        initData(imported);
        saveData();
        alert('导入成功');
      }
    } catch (err) { alert('导入失败'); }
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', function() {
  setupUrlPreview('linkUrl', 'linkPreview', 'linkPreviewIcon', 'linkPreviewDomain');

  document.getElementById('searchBtn').addEventListener('click', doSearch);
  document.getElementById('searchInput').addEventListener('keypress', function(e) { if (e.key === 'Enter') doSearch(); });
  document.getElementById('addGroupBtn').addEventListener('click', openGroupModal);
  document.getElementById('closeGroupModal').addEventListener('click', closeGroupModal);
  document.getElementById('saveGroupBtn').addEventListener('click', saveGroup);
  document.getElementById('cancelGroupBtn').addEventListener('click', closeGroupModal);
  document.getElementById('closeLinkModal').addEventListener('click', closeLinkModal);
  document.getElementById('saveLinkBtn').addEventListener('click', saveLink);
  document.getElementById('cancelLinkBtn').addEventListener('click', closeLinkModal);

  document.querySelectorAll('.search-engine').forEach(function(el) {
    el.addEventListener('click', function() {
      data.searchEngine = this.getAttribute('data-engine');
      saveData();
      renderSearchEngine();
    });
  });

  document.getElementById('settingsBtn').addEventListener('click', function() {
    document.getElementById('bgUrl').value = data.bgUrl || '';
    
    var opL = data.opacityLight || 85;
    var opD = data.opacityDark || 85;
    document.getElementById('opacityLight').value = opL;
    document.getElementById('opacityDark').value = opD;
    document.getElementById('opacityLightVal').textContent = opL + '%';
    document.getElementById('opacityDarkVal').textContent = opD + '%';

    var wd = data.webdav || {url:'', user:'', pass:''};
    document.getElementById('webdavUrl').value = wd.url || '';
    document.getElementById('webdavUser').value = wd.user || '';
    document.getElementById('webdavPass').value = wd.pass || '';
    document.getElementById('webdavStatus').textContent = '';
    
    document.getElementById('settingsModal').classList.add('active');
  });

  document.getElementById('closeSettingsModal').addEventListener('click', function() {
    document.getElementById('settingsModal').classList.remove('active');
  });

  document.getElementById('saveBgBtn').addEventListener('click', function() {
    data.bgUrl = document.getElementById('bgUrl').value.trim();
    saveData();
    applyBackground();
    document.getElementById('settingsModal').classList.remove('active');
  });

  document.getElementById('opacityLight').addEventListener('input', function() {
    var val = parseInt(this.value);
    document.getElementById('opacityLightVal').textContent = val + '%';
    document.documentElement.style.setProperty('--opacity-light', val / 100);
  });
  document.getElementById('opacityDark').addEventListener('input', function() {
    var val = parseInt(this.value);
    document.getElementById('opacityDarkVal').textContent = val + '%';
    document.documentElement.style.setProperty('--opacity-dark', val / 100);
  });
  document.getElementById('saveOpacityBtn').addEventListener('click', function() {
    data.opacityLight = parseInt(document.getElementById('opacityLight').value);
    data.opacityDark = parseInt(document.getElementById('opacityDark').value);
    saveData(); 
  });

  document.getElementById('uploadIconBtn').addEventListener('click', function() { document.getElementById('iconFileInput').click(); });
  document.getElementById('iconFileInput').addEventListener('change', function(e) { var file = e.target.files[0]; if (!file) return; if (file.size > 50 * 1024) { alert('图标需<50KB'); return; } var reader = new FileReader(); reader.onload = function(e) { customIconBase64 = e.target.result; document.getElementById('customIconStatus').textContent = '已选择'; document.getElementById('customIconImg').src = customIconBase64; document.getElementById('customIconPreview').style.display = 'block'; }; reader.readAsDataURL(file); });

  document.getElementById('webdavSaveConfig').addEventListener('click', saveWebdavConfig);
  document.getElementById('webdavUpload').addEventListener('click', webdavUpload);
  document.getElementById('webdavDownload').addEventListener('click', webdavDownload);
  
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', importData);
  document.getElementById('importFile').addEventListener('change', handleImport);

  document.getElementById('syncApplyRemote').addEventListener('click', applyRemoteData);
  document.getElementById('syncKeepLocal').addEventListener('click', keepLocalData);

  document.getElementById('themeToggle').addEventListener('click', function() {
    data.theme = (data.theme === 'dark') ? 'light' : 'dark';
    applyThemeAndOpacity();
    saveData();
  });

  document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('active');
    });
  });

  loadData();
});