# src 目录状态

这里是模块化迁移草稿，不是当前扩展的生产入口。

当前 Chrome 扩展由 `manifest.json` 指向 `newtab.html`，并加载 `theme-boot.js` 和 `main.js`。因此真实运行行为仍以 `main.js` 为准。

修改规则：

- 修真实功能或安全问题时，优先检查并修改 `main.js` 及对应 `main.*.test.js`。
- 只修改 `src/` 不会改变当前新标签页行为。
- 完成 ES module 迁移前，不要把这些模块当作生产入口。
- 迁移时先保持 `main.js` 回归测试通过，再逐步搬移逻辑并切换 `newtab.html` 入口。
