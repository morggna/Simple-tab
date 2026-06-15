/**
 * utils.js - Shared utilities: icons, domain extraction, HTML escaping
 */

export function getDomainName(url) {
  try {
    return new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function getChromeFaviconUrl(pageUrl, size = 32) {
  return `chrome://favicon/size/${size}/@2x/${encodeURIComponent(pageUrl)}`;
}

export function getIconUrls(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    const domain = u.hostname;

    // Baidu 特殊处理：使用官方 favicon
    if (domain.includes('baidu.com')) {
      const baiduIcon = getChromeFaviconUrl(u.href, 64);
      return baiduIcon
        ? [baiduIcon, 'https://www.baidu.com/favicon.ico']
        : ['https://www.baidu.com/favicon.ico'];
    }

    return [
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://icon.horse/icon/${domain}`,
      getChromeFaviconUrl(u.href, 64),
    ].filter(Boolean);
  } catch {
    return [];
  }
}

export function tryNextIcon(img, urls, index = 0) {
  if (index >= urls.length) {
    img.style.display = 'none';
    return;
  }
  img.onerror = () => tryNextIcon(img, urls, index + 1);
  img.src = urls[index];
}

export function getIconUrl(url, _size = 32) {
  return getIconUrls(url)[0];
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
