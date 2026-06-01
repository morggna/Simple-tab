# Simple-tab - 极简新标签页

一个简洁、美观、可自定义的 Chrome 新标签页扩展（已完成模块化重构 v5.5+）。

![preview1](https://raw.githubusercontent.com/morggna/Simple-tab/main/screenshots/preview1.png)
![preview2](https://raw.githubusercontent.com/morggna/Simple-tab/main/screenshots/preview2.png)
![preview3](https://raw.githubusercontent.com/morggna/Simple-tab/main/screenshots/preview3.png)

## ✨ 特性

- 🎨 **简洁美观** - 极简设计风格，支持亮色/暗色主题
- 📁 **分组管理** - 链接分组整理，支持 emoji 图标
- 🔍 **多搜索引擎** - Google、Bing、百度一键切换 + 实时搜索建议
- 🖼️ **自定义背景** - 支持任意图床链接
- ☁️ **WebDAV 同步** - 跨设备配置同步
- 🎚️ **透明度调节** - 自定义卡片透明度
- 📦 **导入导出** - JSON 格式配置备份
- ✏️ **拖拽排序** - 链接和分组均可拖拽排序
- ⌨️ **键盘快捷键** - `?` 键快速聚焦搜索框
- ♿ **无障碍优化** - aria-label、可见焦点
- 🔒 **最小权限** - 按需请求权限

## 📦 安装

手动安装（开发者模式）：

1. 下载仓库代码
2. 解压
3. Chrome → `chrome://extensions/` → 开启开发者模式 → 加载已解压的扩展程序

## 🛠️ 开发

```bash
npm install
npm run lint
npm run format
npm test
```

## 📁 文件结构（模块化 v5.5+）

```
Simple-tab/
├── manifest.json
├── newtab.html
├── main.js                 # 薄协调入口（仅 71 行）
├── src/
│   ├── storage.js          # 数据持久化、迁移、canonical JSON
│   ├── search.js           # 搜索引擎 + 完整搜索建议（含键盘导航）
│   ├── utils.js            # 图标、域名、HTML 转义工具
│   ├── sync.js             # WebDAV 同步与冲突处理
│   ├── ui.js               # 渲染、主题、弹窗、卡片
│   ├── events.js           # 事件绑定、编辑模式
│   ├── storage.test.js
│   └── search.test.js
├── theme-boot.js
├── package.json
├── .eslintrc.json
├── .prettierrc.json
├── vitest.config.js
└── README.md
```

## ⚙️ 技术栈

- 原生 ES Modules + Manifest V3
- Chrome Storage / Permissions API
- WebDAV 协议
- Vitest（测试）

## 📝 更新日志

### v5.5.0 (2026-06-01)
- 完成完整模块化重构（storage / search / ui / events / utils / sync）
- `main.js` 精简至 71 行协调器
- 新增 Vitest 测试
- 完善 ESLint + Prettier + 开发脚本
- `?` 快捷键 + 无障碍增强
- README 全面更新

（历史版本略）

## 📄 许可证

MIT License
