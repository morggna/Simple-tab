(function () {
  try {
    var localData = localStorage.getItem('newtabData');
    var theme = localStorage.getItem('theme') || 'light';
    var opL = 0.85;
    var opD = 0.85;

    if (localData) {
      var d = JSON.parse(localData);
      if (d.theme) theme = d.theme;
      if (typeof d.opacityLight !== 'undefined') opL = d.opacityLight / 100;
      if (typeof d.opacityDark !== 'undefined') opD = d.opacityDark / 100;
    }

    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    document.documentElement.style.setProperty('--opacity-light', opL);
    document.documentElement.style.setProperty('--opacity-dark', opD);
  } catch {
    // Ignore parse/storage errors; page keeps default theme variables.
  }
})();
