# 隐私政策 | Privacy Policy

**最后更新：2025年1月29日**

## 简介

Simple Tab（以下简称"本扩展"）是一款 Chrome 新标签页扩展，我们非常重视用户隐私。本隐私政策说明了本扩展如何处理用户数据。

## 数据收集

**本扩展不收集任何个人信息。**

本扩展仅在本地存储以下配置数据：

- 用户自定义的链接和分组
- 搜索引擎偏好设置
- 背景图片 URL
- 主题设置（亮色/暗色）
- 卡片透明度设置
- WebDAV 同步配置（如用户选择配置）

## 数据存储

- 所有数据存储在用户本地浏览器中（`localStorage` 和 `chrome.storage.local`）
- 本扩展不使用 Chrome 账号的内置同步功能
- 如用户配置 WebDAV 同步，数据将同步到用户自己指定的服务器

## 数据共享

**本扩展不会出售用户数据，也不会在本政策未说明的情况下向第三方共享或传输用户配置。**

## 网络请求

本扩展可能发起以下网络请求：

- 获取网站图标（通过 Chrome favicon 能力，以及 Google、DuckDuckGo、Yandex 等公开 favicon 服务作为备用）
- 获取搜索建议（仅当用户使用搜索框并授权对应搜索引擎域名时，可能请求 Google、Bing 或百度建议服务）
- WebDAV 同步请求（仅当用户主动配置时）

## 权限说明

- `storage`：用于保存用户配置数据
- `unlimitedStorage`：用于降低本地配置和背景图片数据的存储限制影响
- `favicon`：用于读取网站图标
- 可选主机权限：仅在用户使用搜索建议或配置 WebDAV 时按需请求对应域名访问权限

## 用户控制

用户可以随时：

- 通过扩展设置导出/导入配置
- 通过扩展设置删除所有数据
- 卸载扩展以删除所有本地数据

## 联系方式

如有任何隐私相关问题，请通过 GitHub Issues 联系：
https://github.com/morggna/Simple-tab/issues

---

# Privacy Policy (English)

**Last Updated: January 29, 2025**

## Introduction

Simple Tab ("the Extension") is a Chrome new tab extension. We take user privacy seriously. This policy explains how we handle user data.

## Data Collection

**This extension does not collect any personal information.**

The extension only stores the following configuration data locally:

- User-customized links and groups
- Search engine preferences
- Background image URL
- Theme settings (light/dark)
- Card opacity settings
- WebDAV sync configuration (if configured by user)

## Data Storage

- All data is stored locally in the user's browser (`localStorage` and `chrome.storage.local`)
- The extension does not use Chrome account built-in sync
- If the user configures WebDAV sync, data syncs to the user's own specified server

## Data Sharing

**This extension does not sell user data or share/transfer user configuration to third parties except as described in this policy.**

## Network Requests

The extension may make the following network requests:

- Fetching website favicons (via Chrome favicon capabilities, with public favicon services such as Google, DuckDuckGo, and Yandex as fallbacks)
- Fetching search suggestions (only when the user uses the search box and grants the corresponding search-engine host permission; providers may include Google, Bing, or Baidu)
- WebDAV sync requests (only when configured by user)

## Permissions

- `storage`: Used to save user configuration data
- `unlimitedStorage`: Used to reduce local storage limits for configuration and background image data
- `favicon`: Used to read website favicons
- Optional host permissions: Requested only as needed for search suggestions or user-configured WebDAV hosts

## User Control

Users can at any time:

- Export/import configuration via extension settings
- Delete all data via extension settings
- Uninstall the extension to remove all local data

## Contact

For any privacy-related questions, please contact via GitHub Issues:
https://github.com/morggna/Simple-tab/issues
