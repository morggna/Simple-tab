// 默认数据
var defaultData = {
  groups: [
    {
      name: '开发工具',
      icon: '💻',
      links: [
        { name: 'Github', url: 'https://github.com' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com' },
        { name: 'CodePen', url: 'https://codepen.io' }
      ]
    },
    {
      name: '常用网站',
      icon: '⭐',
      links: [
        { name: 'YouTube', url: 'https://youtube.com' },
        { name: 'Twitter', url: 'https://twitter.com' },
        { name: 'Reddit', url: 'https://reddit.com' }
      ]
    }
  ],
  searchEngine: 'google',
  bgUrl: '',
  opacityLight: 85,
  opacityDark: 85
};

// 立即应用主题（在 DOM 解析早期）
(function() {
  var theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  // 应用保存的透明度
  var opacityLight = localStorage.getItem('opacityLight') || 85;
  var opacityDark = localStorage.getItem('opacityDark') || 85;
  document.documentElement.style.setProperty('--opacity-light', opacityLight / 100);
  document.documentElement.style.setProperty('--opacity-dark', opacityDark / 100);
})();

var data = null;
var currentGroupIndex = null;
var currentLinkIndex = null;
var urlInputTimer = null;
var customIconBase64 = null;

// 搜索引擎
var searchEngines = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=' }
};

// 获取图标
function getIconUrl(url, size) {
  try {
    var domain = new URL(url).hostname;
    return 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=' + (size || 64);
  } catch (e) {
    return null;
  }
}

// 从 URL 获取名称
function getDomainName(url) {
  try {
    var hostname = new URL(url).hostname.replace(/^www\./, '');
    var name = hostname.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch (e) {
    return 'Link';
  }
}

// 加载数据
function loadData() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['newtabData'], function(result) {
      data = result.newtabData || defaultData;
      render();
      // 启动时检查云端同步
      setTimeout(checkCloudSync, 500);
    });
  } else {
    var saved = localStorage.getItem('newtabData');
    data = saved ? JSON.parse(saved) : defaultData;
    render();
    // 启动时检查云端同步
    setTimeout(checkCloudSync, 500);
  }
}

// 保存数据
function saveData() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.set({ newtabData: data });
  } else {
    localStorage.setItem('newtabData', JSON.stringify(data));
  }
  
  // 自动同步到 WebDAV（如果已配置）
  autoSyncToWebdav();
}

// 自动同步到 WebDAV（静默）
function autoSyncToWebdav() {
  loadWebdavConfig();
  if (!webdavConfig.url || !webdavConfig.user) return;
  
  var fileUrl = webdavConfig.url.replace(/\/$/, '') + '/newtab-config.json';
  
  fetch(fileUrl, {
    method: 'PUT',
    headers: {
      'Authorization': 'Basic ' + btoa(webdavConfig.user + ':' + webdavConfig.pass),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data, null, 2)
  }).catch(function() {
    // 静默失败，不打扰用户
  });
}

// 启动时检查云端同步
function checkCloudSync() {
  loadWebdavConfig();
  if (!webdavConfig.url || !webdavConfig.user) return;
  
  var fileUrl = webdavConfig.url.replace(/\/$/, '') + '/newtab-config.json';
  
  fetch(fileUrl, {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + btoa(webdavConfig.user + ':' + webdavConfig.pass)
    }
  })
  .then(function(response) {
    if (!response.ok) return null;
    return response.json();
  })
  .then(function(remoteData) {
    if (!remoteData || !remoteData.groups) return;
    
    // 比较本地和远程数据
    var localStr = JSON.stringify(data);
    var remoteStr = JSON.stringify(remoteData);
    
    if (localStr !== remoteStr) {
      showSyncPrompt(remoteData);
    }
  })
  .catch(function() {
    // 网络错误，静默忽略
  });
}

// 显示同步提示
function showSyncPrompt(remoteData) {
  var modal = document.getElementById('syncModal');
  if (modal) {
    window.pendingRemoteData = remoteData;
    modal.classList.add('active');
  }
}

// 应用远程数据
function applyRemoteData() {
  if (window.pendingRemoteData) {
    data = window.pendingRemoteData;
    // 保存到本地但不触发自动上传
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ newtabData: data });
    } else {
      localStorage.setItem('newtabData', JSON.stringify(data));
    }
    render();
    window.pendingRemoteData = null;
  }
  document.getElementById('syncModal').classList.remove('active');
}

// 保留本地数据
function keepLocalData() {
  window.pendingRemoteData = null;
  document.getElementById('syncModal').classList.remove('active');
}

// 渲染
function render() {
  renderGroups();
  renderSearchEngine();
  applyBackground();
}

// 应用背景
function applyBackground() {
  if (data.bgUrl) {
    // 预加载图片，加载完成后再显示
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

// 渲染搜索引擎
function renderSearchEngine() {
  var engines = document.querySelectorAll('.search-engine');
  engines.forEach(function(el) {
    var engine = el.getAttribute('data-engine');
    if (engine === data.searchEngine) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  
  var placeholder = '使用 ' + searchEngines[data.searchEngine].name + ' 搜索...';
  document.getElementById('searchInput').placeholder = placeholder;
}

// 渲染分组
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

// 绑定事件
function bindEvents() {
  // 添加链接按钮
  var addLinkBtns = document.querySelectorAll('.add-link-btn');
  addLinkBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      currentGroupIndex = parseInt(this.getAttribute('data-group-index'));
      openLinkModal();
    });
  });

  // 链接编辑图标 - 修改链接
  var linkEditIcons = document.querySelectorAll('.link-edit-icon');
  linkEditIcons.forEach(function(icon) {
    icon.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var groupIndex = parseInt(this.getAttribute('data-group'));
      var linkIndex = parseInt(this.getAttribute('data-link'));
      openEditLinkModal(groupIndex, linkIndex);
    });
  });

  // 删除链接
  var deleteLinkBtns = document.querySelectorAll('.link-delete');
  deleteLinkBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var groupIndex = parseInt(this.getAttribute('data-group'));
      var linkIndex = parseInt(this.getAttribute('data-link'));
      data.groups[groupIndex].links.splice(linkIndex, 1);
      saveData();
      renderGroups();
    });
  });

  // 编辑按钮 - 切换该分组的编辑模式
  var editGroupBtns = document.querySelectorAll('.edit-group-btn');
  editGroupBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var index = parseInt(this.getAttribute('data-index'));
      
      if (editingGroupIndex === index) {
        // 退出编辑模式
        editingGroupIndex = null;
        isEditMode = false;
      } else {
        // 进入该分组的编辑模式
        editingGroupIndex = index;
        isEditMode = true;
      }
      
      renderGroups();
    });
  });

  // 分组编辑图标 - 修改分组名称
  var groupEditIcons = document.querySelectorAll('.group-edit-icon');
  groupEditIcons.forEach(function(icon) {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      var index = parseInt(this.getAttribute('data-index'));
      openEditGroupModal(index);
    });
  });

  // 删除分组
  var deleteGroupBtns = document.querySelectorAll('.delete-group-btn');
  deleteGroupBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var index = parseInt(this.getAttribute('data-index'));
      if (confirm('确定删除分组 "' + data.groups[index].name + '" 及其所有链接？')) {
        data.groups.splice(index, 1);
        editingGroupIndex = null;
        isEditMode = false;
        saveData();
        renderGroups();
      }
    });
  });

  // 设置当前编辑分组的样式和拖拽
  if (editingGroupIndex !== null) {
    var editingSection = document.querySelector('.group-section[data-group-index="' + editingGroupIndex + '"]');
    if (editingSection) {
      editingSection.classList.add('editing');
      setupDragAndDrop(editingGroupIndex);
      setupGroupDragAndDrop();
    }
  }
}

// 更新编辑按钮状态（不再需要全局更新）

// 打开编辑分组弹窗
function openEditGroupModal(index) {
  currentGroupIndex = index;
  var group = data.groups[index];
  document.getElementById('groupName').value = group.name;
  document.getElementById('groupIcon').value = group.icon;
  document.getElementById('groupModalTitle').textContent = '编辑分组';
  document.getElementById('groupModal').classList.add('active');
}

// 拖拽排序 - 只对指定分组内的链接生效
function setupDragAndDrop(groupIndex) {
  var linksRow = document.querySelector('.links-row[data-group-index="' + groupIndex + '"]');
  if (!linksRow) return;
  
  var linkCards = linksRow.querySelectorAll('.link-card');
  
  linkCards.forEach(function(card) {
    card.setAttribute('draggable', 'true');
    
    card.addEventListener('click', function(e) {
      if (editingGroupIndex !== null) {
        e.preventDefault();
      }
    });
    
    card.addEventListener('dragstart', function(e) {
      if (editingGroupIndex === null) {
        e.preventDefault();
        return;
      }
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({
        groupIndex: this.getAttribute('data-group'),
        linkIndex: this.getAttribute('data-link')
      }));
    });
    
    card.addEventListener('dragend', function() {
      this.classList.remove('dragging');
      document.querySelectorAll('.link-card').forEach(function(c) {
        c.classList.remove('drag-over');
      });
    });
    
    card.addEventListener('dragover', function(e) {
      if (editingGroupIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.classList.add('drag-over');
    });
    
    card.addEventListener('dragleave', function() {
      this.classList.remove('drag-over');
    });
    
    card.addEventListener('drop', function(e) {
      if (editingGroupIndex === null) return;
      e.preventDefault();
      this.classList.remove('drag-over');
      
      var sourceData = JSON.parse(e.dataTransfer.getData('text/plain'));
      var targetGroupIndex = parseInt(this.getAttribute('data-group'));
      var targetLinkIndex = parseInt(this.getAttribute('data-link'));
      var sourceGroupIndex = parseInt(sourceData.groupIndex);
      var sourceLinkIndex = parseInt(sourceData.linkIndex);
      
      if (sourceGroupIndex === targetGroupIndex && sourceLinkIndex === targetLinkIndex) {
        return;
      }
      
      // 只允许同分组内排序
      if (sourceGroupIndex === targetGroupIndex) {
        var links = data.groups[sourceGroupIndex].links;
        var movedLink = links.splice(sourceLinkIndex, 1)[0];
        links.splice(targetLinkIndex, 0, movedLink);
        saveData();
        renderGroups();
      }
    });
  });
}

// 分组拖拽排序
function setupGroupDragAndDrop() {
  var groupSections = document.querySelectorAll('.group-section');
  
  groupSections.forEach(function(section) {
    var header = section.querySelector('.group-header');
    
    section.setAttribute('draggable', 'true');
    
    section.addEventListener('dragstart', function(e) {
      if (editingGroupIndex === null) {
        e.preventDefault();
        return;
      }
      // 只有拖动 header 区域才能拖动分组
      if (!e.target.classList.contains('group-section')) return;
      this.classList.add('dragging-group');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/group', this.getAttribute('data-group-index'));
    });
    
    section.addEventListener('dragend', function() {
      this.classList.remove('dragging-group');
      document.querySelectorAll('.group-section').forEach(function(s) {
        s.classList.remove('drag-over-group');
      });
    });
    
    section.addEventListener('dragover', function(e) {
      if (editingGroupIndex === null) return;
      if (e.dataTransfer.types.includes('application/group')) {
        e.preventDefault();
        this.classList.add('drag-over-group');
      }
    });
    
    section.addEventListener('dragleave', function() {
      this.classList.remove('drag-over-group');
    });
    
    section.addEventListener('drop', function(e) {
      if (editingGroupIndex === null) return;
      if (!e.dataTransfer.types.includes('application/group')) return;
      
      e.preventDefault();
      this.classList.remove('drag-over-group');
      
      var sourceIndex = parseInt(e.dataTransfer.getData('application/group'));
      var targetIndex = parseInt(this.getAttribute('data-group-index'));
      
      if (sourceIndex === targetIndex) return;
      
      var movedGroup = data.groups.splice(sourceIndex, 1)[0];
      data.groups.splice(targetIndex, 0, movedGroup);
      
      // 更新 editingGroupIndex
      if (editingGroupIndex === sourceIndex) {
        editingGroupIndex = targetIndex;
      } else if (sourceIndex < editingGroupIndex && targetIndex >= editingGroupIndex) {
        editingGroupIndex--;
      } else if (sourceIndex > editingGroupIndex && targetIndex <= editingGroupIndex) {
        editingGroupIndex++;
      }
      
      saveData();
      renderGroups();
    });
  });
}

// URL 输入预览
function setupUrlPreview(urlInputId, previewContainerId, previewIconId, previewDomainId) {
  var urlInput = document.getElementById(urlInputId);
  
  urlInput.addEventListener('input', function() {
    clearTimeout(urlInputTimer);
    var url = this.value.trim();
    
    urlInputTimer = setTimeout(function() {
      if (url && (url.startsWith('http') || url.includes('.'))) {
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }
        
        var iconUrl = getIconUrl(url);
        var domain = getDomainName(url);
        
        if (iconUrl) {
          document.getElementById(previewIconId).src = iconUrl;
          document.getElementById(previewDomainId).textContent = domain;
          document.getElementById(previewContainerId).style.display = 'flex';
        }
      } else {
        document.getElementById(previewContainerId).style.display = 'none';
      }
    }, 300);
  });
}

// 链接弹窗
function openLinkModal() {
  currentLinkIndex = null;
  document.getElementById('linkUrl').value = '';
  document.getElementById('linkName').value = '';
  document.getElementById('linkPreview').style.display = 'none';
  document.getElementById('linkModalTitle').textContent = '添加链接';
  // 重置自定义图标
  customIconBase64 = null;
  document.getElementById('customIconStatus').textContent = '未选择';
  document.getElementById('customIconPreview').style.display = 'none';
  document.getElementById('linkModal').classList.add('active');
  document.getElementById('linkUrl').focus();
}

// 打开编辑链接弹窗
function openEditLinkModal(groupIndex, linkIndex) {
  currentGroupIndex = groupIndex;
  currentLinkIndex = linkIndex;
  var link = data.groups[groupIndex].links[linkIndex];
  
  document.getElementById('linkUrl').value = link.url;
  document.getElementById('linkName').value = link.name;
  document.getElementById('linkModalTitle').textContent = '编辑链接';
  
  // 显示图标预览
  var iconUrl = link.customIcon || getIconUrl(link.url);
  if (iconUrl) {
    document.getElementById('linkPreviewIcon').src = iconUrl;
    document.getElementById('linkPreviewDomain').textContent = getDomainName(link.url);
    document.getElementById('linkPreview').style.display = 'flex';
  }
  
  // 自定义图标状态
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

function closeLinkModal() {
  document.getElementById('linkModal').classList.remove('active');
  currentGroupIndex = null;
}

function saveLink() {
  var url = document.getElementById('linkUrl').value.trim();
  var name = document.getElementById('linkName').value.trim();

  if (!url) return;
  if (!url.startsWith('http')) url = 'https://' + url;
  if (!name) name = getDomainName(url);

  if (currentLinkIndex !== null && data.groups[currentGroupIndex].links[currentLinkIndex]) {
    // 编辑现有链接
    data.groups[currentGroupIndex].links[currentLinkIndex].name = name;
    data.groups[currentGroupIndex].links[currentLinkIndex].url = url;
    if (customIconBase64) {
      data.groups[currentGroupIndex].links[currentLinkIndex].customIcon = customIconBase64;
    } else {
      delete data.groups[currentGroupIndex].links[currentLinkIndex].customIcon;
    }
  } else {
    // 添加新链接
    var newLink = { name: name, url: url };
    if (customIconBase64) {
      newLink.customIcon = customIconBase64;
    }
    data.groups[currentGroupIndex].links.push(newLink);
  }

  saveData();
  render();
  closeLinkModal();
}

// 分组弹窗
function openGroupModal() {
  currentGroupIndex = null;
  document.getElementById('groupName').value = '';
  document.getElementById('groupIcon').value = '';
  document.getElementById('groupModalTitle').textContent = '添加分组';
  document.getElementById('groupModal').classList.add('active');
  document.getElementById('groupName').focus();
}

function closeGroupModal() {
  document.getElementById('groupModal').classList.remove('active');
}

function saveGroup() {
  var name = document.getElementById('groupName').value.trim();
  var icon = document.getElementById('groupIcon').value.trim() || '📁';

  if (!name) return;

  if (currentGroupIndex !== null && data.groups[currentGroupIndex]) {
    // 编辑现有分组
    data.groups[currentGroupIndex].name = name;
    data.groups[currentGroupIndex].icon = icon;
  } else {
    // 添加新分组
    data.groups.push({ name: name, icon: icon, links: [] });
  }
  
  saveData();
  render();
  closeGroupModal();
}

// 搜索
function doSearch() {
  var query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  window.location.href = searchEngines[data.searchEngine].url + encodeURIComponent(query);
}

// 导出导入
function exportData() {
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'newtab-config.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  document.getElementById('importFile').click();
}

function handleImport(e) {
  var file = e.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var imported = JSON.parse(e.target.result);
      if (imported.groups) {
        data = imported;
        saveData();
        render();
        alert('导入成功');
      }
    } catch (err) {
      alert('导入失败');
    }
  };
  reader.readAsText(file);
}

// WebDAV 配置
var webdavConfig = {
  url: '',
  user: '',
  pass: ''
};

function loadWebdavConfig() {
  var saved = localStorage.getItem('webdavConfig');
  if (saved) {
    webdavConfig = JSON.parse(saved);
  }
}

function saveWebdavConfig() {
  webdavConfig.url = document.getElementById('webdavUrl').value.trim();
  webdavConfig.user = document.getElementById('webdavUser').value.trim();
  webdavConfig.pass = document.getElementById('webdavPass').value;
  localStorage.setItem('webdavConfig', JSON.stringify(webdavConfig));
  showWebdavStatus('配置已保存', 'success');
}

function showWebdavStatus(msg, type) {
  var el = document.getElementById('webdavStatus');
  el.textContent = msg;
  el.style.color = type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : 'var(--text-muted)';
}

// WebDAV 上传
function webdavUpload() {
  if (!webdavConfig.url) {
    showWebdavStatus('请先配置 WebDAV 地址', 'error');
    return;
  }

  showWebdavStatus('正在上传...', 'info');

  var fileUrl = webdavConfig.url.replace(/\/$/, '') + '/newtab-config.json';
  
  fetch(fileUrl, {
    method: 'PUT',
    headers: {
      'Authorization': 'Basic ' + btoa(webdavConfig.user + ':' + webdavConfig.pass),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data, null, 2)
  })
  .then(function(response) {
    if (response.ok || response.status === 201 || response.status === 204) {
      showWebdavStatus('上传成功 ✓', 'success');
    } else {
      throw new Error('HTTP ' + response.status);
    }
  })
  .catch(function(err) {
    showWebdavStatus('上传失败: ' + err.message, 'error');
  });
}

// WebDAV 下载
function webdavDownload() {
  if (!webdavConfig.url) {
    showWebdavStatus('请先配置 WebDAV 地址', 'error');
    return;
  }

  showWebdavStatus('正在下载...', 'info');

  var fileUrl = webdavConfig.url.replace(/\/$/, '') + '/newtab-config.json';

  fetch(fileUrl, {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + btoa(webdavConfig.user + ':' + webdavConfig.pass)
    }
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    return response.json();
  })
  .then(function(remoteData) {
    if (remoteData.groups) {
      data = remoteData;
      saveData();
      render();
      showWebdavStatus('下载成功 ✓', 'success');
    } else {
      throw new Error('无效的配置文件');
    }
  })
  .catch(function(err) {
    showWebdavStatus('下载失败: ' + err.message, 'error');
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  setupUrlPreview('linkUrl', 'linkPreview', 'linkPreviewIcon', 'linkPreviewDomain');

  // 搜索引擎切换
  var engines = document.querySelectorAll('.search-engine');
  engines.forEach(function(el) {
    el.addEventListener('click', function() {
      data.searchEngine = this.getAttribute('data-engine');
      saveData();
      renderSearchEngine();
    });
  });

  // 搜索
  document.getElementById('searchBtn').addEventListener('click', doSearch);
  document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') doSearch();
  });

  // 添加分组
  document.getElementById('addGroupBtn').addEventListener('click', openGroupModal);
  document.getElementById('closeGroupModal').addEventListener('click', closeGroupModal);
  document.getElementById('saveGroupBtn').addEventListener('click', saveGroup);
  document.getElementById('cancelGroupBtn').addEventListener('click', closeGroupModal);

  // 添加链接
  document.getElementById('closeLinkModal').addEventListener('click', closeLinkModal);
  document.getElementById('saveLinkBtn').addEventListener('click', saveLink);
  document.getElementById('cancelLinkBtn').addEventListener('click', closeLinkModal);

  // 设置
  document.getElementById('settingsBtn').addEventListener('click', function() {
    document.getElementById('bgUrl').value = data.bgUrl || '';
    // 加载透明度设置
    var opacityLight = localStorage.getItem('opacityLight') || 85;
    var opacityDark = localStorage.getItem('opacityDark') || 85;
    document.getElementById('opacityLight').value = opacityLight;
    document.getElementById('opacityDark').value = opacityDark;
    document.getElementById('opacityLightVal').textContent = opacityLight + '%';
    document.getElementById('opacityDarkVal').textContent = opacityDark + '%';
    // 加载 WebDAV 配置
    loadWebdavConfig();
    document.getElementById('webdavUrl').value = webdavConfig.url || '';
    document.getElementById('webdavUser').value = webdavConfig.user || '';
    document.getElementById('webdavPass').value = webdavConfig.pass || '';
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

  // 透明度滑块实时预览
  document.getElementById('opacityLight').addEventListener('input', function() {
    document.getElementById('opacityLightVal').textContent = this.value + '%';
    document.documentElement.style.setProperty('--opacity-light', this.value / 100);
  });

  document.getElementById('opacityDark').addEventListener('input', function() {
    document.getElementById('opacityDarkVal').textContent = this.value + '%';
    document.documentElement.style.setProperty('--opacity-dark', this.value / 100);
  });

  // 保存透明度
  document.getElementById('saveOpacityBtn').addEventListener('click', function() {
    var opacityLight = document.getElementById('opacityLight').value;
    var opacityDark = document.getElementById('opacityDark').value;
    localStorage.setItem('opacityLight', opacityLight);
    localStorage.setItem('opacityDark', opacityDark);
    document.documentElement.style.setProperty('--opacity-light', opacityLight / 100);
    document.documentElement.style.setProperty('--opacity-dark', opacityDark / 100);
  });

  // 图标上传
  document.getElementById('uploadIconBtn').addEventListener('click', function() {
    document.getElementById('iconFileInput').click();
  });

  document.getElementById('iconFileInput').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;

    // 检查文件大小（限制 50KB）
    if (file.size > 50 * 1024) {
      alert('图标太大，请选择小于 50KB 的图片');
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      customIconBase64 = e.target.result;
      document.getElementById('customIconStatus').textContent = '已选择';
      document.getElementById('customIconImg').src = customIconBase64;
      document.getElementById('customIconPreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', importData);
  document.getElementById('importFile').addEventListener('change', handleImport);

  // WebDAV
  document.getElementById('webdavSaveConfig').addEventListener('click', saveWebdavConfig);
  document.getElementById('webdavUpload').addEventListener('click', webdavUpload);
  document.getElementById('webdavDownload').addEventListener('click', webdavDownload);

  // 同步提示
  document.getElementById('syncApplyRemote').addEventListener('click', applyRemoteData);
  document.getElementById('syncKeepLocal').addEventListener('click', keepLocalData);

  // 暗黑模式切换
  document.getElementById('themeToggle').addEventListener('click', function() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      this.textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      this.textContent = '☀️';
    }
  });

  // 加载保存的主题
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('themeToggle').textContent = '☀️';
  }

  // 点击弹窗外部关闭
  var modals = document.querySelectorAll('.modal');
  modals.forEach(function(modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  });

  loadData();
});
