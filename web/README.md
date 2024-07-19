# Session Key Manager 前端文档

## 概述

Session Key Manager的前端是一个使用原生HTML、CSS和JavaScript构建的单页应用程序（SPA）。它提供了一个直观的用户界面，用于管理会话密钥，包括创建、查看、更新和删除操作。

## 文件结构

```
/web
├── index.html
├── app.js
├── styles.css
└── logo.png
```

- `index.html`: 主HTML文件，定义了应用的基本结构
- `app.js`: 包含所有的JavaScript逻辑
- `styles.css`: 定义了应用的样式
- `logo.png`: 应用的logo图片

## 主要功能

1. 显示所有会话密钥
2. 创建新的会话密钥
3. 更新会话密钥状态（激活/停用）
4. 删除会话密钥
5. 使用会话密钥进行身份验证跳转
6. 支持隔离挑战模式的跳转
7. 设置管理（API URL, BASE URL, 认证令牌）

## 技术细节

### HTML (index.html)

主HTML文件定义了应用的基本结构，包括：

- 页面头部（meta标签、标题、样式链接）
- 主应用容器 (`<div id="app">`)
- 导航栏
- 内容区域 (`<div id="content">`)
- 脚本引用（Axios和app.js）

### JavaScript (app.js)

`app.js`文件包含了应用的所有逻辑，主要功能包括：

1. 全局变量管理（API_URL, BASE_URL, AUTH_TOKEN）
2. API请求函数 (`apiRequest`)
3. 页面渲染函数 (`renderSessionKeyManager`)
4. 事件处理函数（创建、更新、删除会话密钥等）
5. 模态框管理（设置、确认删除等）
6. 通知显示函数 (`showNotification`, `showError`, `showSuccess`)

### CSS (styles.css)

`styles.css`文件定义了应用的样式，包括：

- 全局变量（颜色、字体等）
- 基础样式（body, container等）
- 组件样式（表单、表格、按钮等）
- 模态框样式
- 响应式设计样式

## 使用方法

1. 打开 `index.html` 文件，应用将自动加载。
2. 使用顶部的表单创建新的会话密钥。
3. 在表格中查看所有会话密钥。
4. 使用表格中的按钮执行各种操作（激活/停用、删除、跳转等）。
5. 点击右上角的设置图标来配置应用设置。

## 自定义和扩展

1. 修改 `styles.css` 中的CSS变量来自定义应用的外观。
2. 在 `app.js` 中添加新的函数来扩展功能。
3. 如需添加新页面，可以在 `app.js` 中创建新的渲染函数，并在导航逻辑中添加相应的路由。

## 开发注意事项

1. 所有的API请求都通过 `apiRequest` 函数进行，确保在修改API调用时更新此函数。
2. 使用 `showNotification`, `showError`, 和 `showSuccess` 函数来显示用户反馈。
3. 所有的DOM操作都应在各自的渲染函数中进行，以保持代码的清晰和可维护性。
4. 确保在添加新功能时更新错误处理逻辑。

## 安全考虑

1. 避免在前端存储敏感信息。当前，API URL、BASE URL和认证令牌存储在localStorage中，在生产环境中应考虑更安全的存储方式。
2. 所有的用户输入都应该在前端和后端都进行验证和清理。

## 性能优化

1. 考虑使用防抖（debounce）技术来优化频繁的API调用（如搜索功能）。
2. 对于大量数据，考虑实现分页或无限滚动。

## 浏览器兼容性

当前的实现主要针对现代浏览器。如果需要支持旧版浏览器，可能需要添加相应的polyfills或使用Babel进行转译。

## 贡献指南

1. 遵循现有的代码风格和组织结构。
2. 对于新功能，请先创建一个issue进行讨论。
3. 确保所有的更改都经过充分测试。
4. 更新相关文档，包括这个README文件。

