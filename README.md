# ClipCapture - 快速笔记捕获工具

一款基于 Electron 的桌面笔记工具，支持快速捕获灵感、AI 智能分类整理、图片粘贴保存。

## 演示

[![ClipCapture 演示视频](https://img.shields.io/badge/演示-B站-red)](https://www.bilibili.com/video/BV1eQT56JENq/)

## 功能特性

### 快速捕获
- 全局快捷键 `Ctrl+Shift+C` 呼出悬浮窗口，随时随地记录灵感
- 支持粘贴图片，自动保存到笔记中
- AI 自动生成标题、分类和摘要

### 笔记管理
- 笔记列表展示，支持搜索筛选
- 按分类浏览（工作、技术、学习、生活、灵感）
- AI 一键批量分类整理
- 笔记内容支持图片粘贴与显示

### AI 能力
- **智能标题生成**：根据内容自动生成标题
- **内容摘要**：AI 总结笔记要点
- **自动分类**：将笔记归类到预设分类
- **批量整理**：一键为所有未分类笔记生成标题、分类和摘要

### 系统集成
- 系统托盘常驻，右键菜单操作
- 全局快捷键：
  - `Ctrl+Shift+C` - 打开快速捕获
  - `Ctrl+Shift+W` - 打开主窗口
- 跨窗口同步，QuickCapture 保存后主窗口自动刷新

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装

```bash
# 克隆仓库
git clone https://github.com/YANSU7/clipcapture.git
cd clipcapture

# 安装依赖
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
npm run package
```

## 配置 API

支持任何兼容 OpenAI 格式的 API（OpenAI、DeepSeek 等）：

1. 打开应用 → 点击设置 ⚙
2. 填写：
   - **API Key**：你的 API 密钥
   - **API 地址**：API 端点地址（如 `https://api.openai.com/v1` 或 `https://api.deepseek.com/v1`）
   - **模型名称**：使用的模型（如 `gpt-4o-mini`、`deepseek-v4-flash`）

### 环境变量（备用）

如果未在设置中配置，会回退到环境变量：

```bash
export OPENAI_API_KEY=sk-xxx
export OPENAI_BASE_URL=https://api.openai.com/v1
```

## 项目结构

```
clipcapture/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 入口：窗口管理、托盘、快捷键
│   │   ├── ipc/
│   │   │   └── handlers.ts      # IPC 处理器
│   │   ├── services/
│   │   │   ├── ai.ts            # AI 服务（OpenAI SDK）
│   │   │   ├── config.ts        # 配置管理
│   │   │   └── database.ts      # 数据存储（JSON 文件）
│   │   └── utils/
│   │       └── icon.ts          # 托盘图标生成
│   ├── preload/
│   │   └── index.ts             # 上下文桥接
│   └── renderer/                # React 前端
│       ├── App.tsx              # 主应用组件
│       ├── components/
│       │   ├── NoteEditor.tsx   # 笔记编辑器（支持图片）
│       │   ├── NoteList.tsx     # 笔记列表（分类筛选）
│       │   ├── QuickCapture.tsx # 快速捕获窗口
│       │   └── Settings.tsx     # 设置页面
│       ├── hooks/
│       │   └── useNotes.ts      # 笔记状态管理
│       ├── types/
│       │   ├── index.ts         # 类型定义
│       │   └── global.d.ts      # 全局类型声明
│       └── styles/
│           └── global.css       # 全局样式
├── package.json
├── electron-vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── assets/                    # 演示视频等资源
└── .gitignore
```

## 数据存储

所有数据存储在系统用户目录下：

- **笔记数据**：`{userData}/notes.json`
- **应用配置**：`{userData}/config.json`

> 笔记和配置不会保存在项目目录中，推送到 GitHub 时不会泄露。

## 技术栈

| 技术 | 用途 |
|------|------|
| Electron 33 | 桌面框架 |
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| electron-vite | 构建工具 |
| OpenAI SDK | AI 接口 |
| UUID | 唯一标识 |

## 许可

MIT
