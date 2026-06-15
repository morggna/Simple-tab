# Simple-tab - 极简新标签页

一个简洁、可自定义的 Chrome 新标签页扩展。当前稳定运行路径是 `manifest.json` -> `newtab.html` -> `theme-boot.js` + `main.js`。

![preview1](https://raw.githubusercontent.com/morggna/Simple-tab/main/screenshots/preview1.png)
![preview2](https://raw.githubusercontent.com/morggna/Simple-tab/main/screenshots/preview2.png)
![preview3](https://raw.githubusercontent.com/morggna/Simple-tab/main/screenshots/preview3.png)

## 特性

- **分组管理** - 链接分组整理，支持 emoji 图标
- **多搜索引擎** - Google、Bing、百度一键切换和实时搜索建议
- **自定义背景** - 支持安全的 HTTP(S) 图片链接和受限的 base64 raster 图片
- **WebDAV 同步** - 跨设备配置同步
- **透明度调节** - 自定义亮色/暗色主题下的卡片透明度
- **导入导出** - JSON 格式配置备份
- **拖拽排序** - 链接和分组均可拖拽排序
- **最小权限** - 搜索建议和 WebDAV 主机权限按需请求
- **安全渲染** - 运行时代码会转义分组/链接文本，并过滤不安全的链接、图标和背景 URL

## 安装

手动安装（开发者模式）：

1. 下载仓库代码
2. 解压
3. 打开 Chrome 的 `chrome://extensions/`
4. 开启开发者模式
5. 选择“加载已解压的扩展程序”，加载本目录

## 开发

```bash
npm install
npm test
npm run lint
npm run format:check
```

`npm run dev` 只会提示手动加载扩展，不会启动开发服务器。

## 当前架构

当前扩展实际加载的是经典脚本：

```text
manifest.json
└── chrome_url_overrides.newtab = newtab.html
    ├── theme-boot.js
    └── main.js
```

`main.js` 目前仍是主要运行文件，包含数据初始化、渲染、事件绑定、搜索建议、WebDAV 同步、导入导出和设置面板逻辑。

`src/` 目录中有模块化拆分草稿和对应测试，但它们尚未被 `newtab.html` 作为生产入口加载。后续如果要完成 ES module 迁移，需要单独把 `newtab.html` 改为模块入口，并同步迁移 `main.js` 中已经验证过的运行时行为和安全过滤逻辑。

## 文件结构

```text
Simple-tab/
├── manifest.json              # Manifest V3 配置，新标签页入口指向 newtab.html
├── newtab.html                # 当前页面结构、样式和脚本入口
├── theme-boot.js              # 首屏主题和透明度预设，减少闪烁
├── main.js                    # 当前生产运行脚本
├── main.renderGroups.test.js  # 当前运行脚本的链接/分组渲染安全回归测试
├── main.applyBackground.test.js # 当前运行脚本的背景 URL 安全回归测试
├── src/                       # 模块化迁移草稿，暂未接入生产入口
│   ├── README.md              # 说明 src/ 当前不是生产入口
│   ├── storage.js
│   ├── search.js
│   ├── utils.js
│   ├── sync.js
│   ├── ui.js
│   ├── events.js
│   └── *.test.js
├── vitest.config.js
├── vitest.setup.js
├── .eslintrc.json
├── .prettierrc.json
└── README.md
```

## 测试

当前测试覆盖两类内容：

- `main.*.test.js`：针对当前生产运行脚本 `main.js` 的回归测试
- `src/*.test.js`：针对模块化迁移草稿中可独立验证的工具和模块逻辑

重点安全回归：

- `renderGroups()` 不应把导入、同步或本地存储中的分组/链接数据渲染为可执行 HTML
- `applyBackground()` 不应把 `javascript:`、`vbscript:`、`data:text/html`、`data:image/svg+xml` 或 CSS-breaking payload 应用为背景图

## 技术栈

- Chrome Extension Manifest V3
- 原生 JavaScript 和 DOM API
- `localStorage` + `chrome.storage.local`
- WebDAV 同步
- Vitest
- ESLint + Prettier

## 迁移状态

模块化重构尚未完成。当前不要只修改 `src/ui.js` 并假设会影响真实新标签页；真实页面仍由 `main.js` 驱动。

建议迁移顺序：

1. 保持 `main.js` 的安全回归测试为迁移保护网
2. 明确模块入口和依赖边界
3. 把 `main.js` 中的已验证行为逐步搬入 `src/`
4. 最后再把 `newtab.html` 切换到 `type="module"` 入口

## 许可证

MIT License
