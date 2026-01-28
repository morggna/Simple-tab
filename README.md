# Simple-tab - 极简新标签页

一个简洁、美观、可自定义的 Chrome 新标签页扩展。
![preview1](https://raw.githubusercontent.com/morggna/Simple-tab/main/screenshots/preview1.png)
![preview2](https://raw.githubusercontent.com/morggna/Simple-tab/main/screenshots/preview2.png)
![preview3](https://raw.githubusercontent.com/morggna/Simple-tab/main/screenshots/preview3.png)

## ✨ 特性

- 🎨 **简洁美观** - 极简设计风格，支持亮色/暗色主题
- 📁 **分组管理** - 链接分组整理，支持 emoji 图标
- 🔍 **多搜索引擎** - Google、Bing、百度一键切换
- 🖼️ **自定义背景** - 支持任意图床链接
- ☁️ **WebDAV 同步** - 跨设备配置同步（支持 Synology、坚果云等）
- 🎚️ **透明度调节** - 自定义卡片透明度
- 📦 **导入导出** - JSON 格式配置备份
- ✏️ **拖拽排序** - 链接和分组均可拖拽排序

## 📦 安装

### 方式：手动安装（开发者模式）

1. 下载本仓库代码（[Download ZIP](https://github.com/YOUR_USERNAME/Simple-tab/archive/refs/heads/main.zip)）
2. 解压到本地文件夹
3. 打开 Chrome，访问 `chrome://extensions/`
4. 开启右上角「开发者模式」
5. 点击「加载已解压的扩展程序」
6. 选择解压后的文件夹

不上架任意浏览器商店，完全透明

## 🎯 使用说明

### 基本操作

| 操作 | 说明 |
|------|------|
| 点击链接 | 打开网站 |
| 点击「编辑」 | 进入编辑模式，显示删除按钮和添加按钮 |
| 点击「完成」 | 退出编辑模式 |
| 点击链接旁的 ✎ | 编辑链接名称、URL、图标 |
| 点击分组旁的 ✎ | 编辑分组名称和图标 |
| 拖拽链接 | 编辑模式下可排序 |
| 拖拽分组 | 编辑模式下可排序 |

### 设置选项

点击右上角 ⚙️ 打开设置：

- **外观** - 调整亮色/暗色模式下的卡片透明度
- **背景** - 设置自定义背景图片 URL
- **WebDAV 同步** - 配置云同步
- **本地数据** - 导出/导入配置

### 主题切换

点击右上角 🌙/☀️ 切换亮色/暗色主题。

## ☁️ WebDAV 同步配置

支持通过 WebDAV 协议同步配置到云端，实现多设备同步。

### Synology NAS 配置

1. DSM → 套件中心 → 安装「WebDAV Server」
2. 启用 HTTPS（默认端口 5006）
3. 创建共享文件夹（如 `newtab`）
4. 在扩展设置中填入：
   - 服务器地址：`https://你的域名:5006/newtab`
   - 用户名/密码：NAS 账号

### 坚果云配置

1. 登录坚果云网页版 → 账户信息 → 安全选项
2. 添加应用密码
3. 在扩展设置中填入：
   - 服务器地址：`https://dav.jianguoyun.com/dav/你的文件夹`
   - 用户名：坚果云账号邮箱
   - 密码：应用密码（非登录密码）

### 同步机制

- **自动上传**：每次修改配置后自动上传到云端
- **启动检查**：打开新标签页时检查云端是否有更新
- **冲突处理**：发现不一致时弹窗询问使用云端还是本地

## 📁 文件结构

```
Simple-tab/
├── manifest.json      # 扩展配置
├── newtab.html        # 主页面
├── main.js            # 核心逻辑
├── icon.svg           # 矢量图标
├── icon16.png         # 16x16 图标
├── icon48.png         # 48x48 图标
├── icon128.png        # 128x128 图标
└── README.md          # 说明文档
```

## ⚙️ 技术栈

- 原生 HTML/CSS/JavaScript
- Chrome Extension Manifest V3
- Chrome Storage API
- WebDAV 协议

## 🔒 隐私说明

- 所有数据存储在本地（Chrome Storage）
- WebDAV 同步为可选功能，需用户手动配置
- 不收集任何用户数据
- 不包含任何追踪代码
- 结构简单，轻松审查

## 📝 更新日志

### v5.2 (2025-01-29)
- 新增 WebDAV 云同步功能
- 新增卡片透明度自定义
- 新增链接编辑功能
- 优化暗色模式显示效果
- 修复编辑按钮状态问题

### v5.1
- 新增暗色模式
- 新增分组拖拽排序
- 新增自定义图标上传

### v5.0
- 初始版本
- 基础链接管理
- 多搜索引擎支持
- 自定义背景

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

## 📄 许可证

MIT License
