# LLM Wiki Ingest

> 自动化知识库摄取工具，支持飞书 Wiki 和扣子智能体两种环境

## 📖 概述

LLM Wiki Ingest 是一个智能文档摄取工具，能够自动处理飞书云空间中的文档，提取知识并构建结构化的知识库。

**核心能力**：
- 🤖 自动文档分类（主题识别）
- 🏷️ 实体提取与关联
- 🗂️ 智能归档管理
- 🔗 层级结构构建

**支持环境**：
- ✅ 飞书 Wiki（团队协作）
- ✅ 扣子智能体（个人/Agent 使用）

---

## 🎯 功能特性

### 1. 智能文档摄取
- 自动从 `待处理` 文件夹读取文档
- 支持 docx、doc、bitable、sheet 等格式
- 提取核心摘要、知识点、实体信息

### 2. 主题分类
自动识别三大主题类别：
- **Agent 架构体系**：星形架构、Main/Sub Agent、调度协作
- **可观测性与追踪**：LangSmith、链路追踪、监控
- **前后端协作规范**：Stream、事件流、通信协议

### 3. 实体管理
- 自动创建实体百科页面
- 建立实体间关联关系
- 追踪实体来源文档

### 4. 归档系统
- 原始文档完整归档
- 自动移动到 `已归档` 文件夹
- 保留可追溯的文档链路

---

## 🏗️ 架构设计

### 知识库结构

```
Wiki（空间/Workspace）
├── 🏠 首页（导航索引）
├── 🎯 Agent 架构体系
│   ├── 🧱 DeepAgents（实体）
│   ├── 🎭 Main Agent（实体）
│   ├── 🤖 Sub Agent（实体）
│   ├── ⭐ 星形架构（概念）
│   ├── 📡 事件流（概念）
│   └── 🔗 LangChain（实体）
├── 🔍 可观测性与追踪
│   ├── 📊 LangSmith（实体）
│   ├── 🔗 全链路追踪（概念）
│   └── 📝 MeowBot（归档）
├── 🤝 前后端协作规范
│   └── 📖 Stream对接（归档）
├── 📦 归档文档索引
│   └── 📄 部署方案（归档）
├── ⚙️ 系统索引
└── 📋 log
```

### 关键设计原则

1. **首页与主题平行**
   - 首页不作为父节点，纯粹作为导航索引
   - 主题页作为内容容器，拥有子文档

2. **双层引用结构**
   - 实体有独立页面，多处引用
   - 归档文档归属主题，侧边栏可访问

3. **可点击链接**
   - 飞书环境：`[文本](https://www.feishu.cn/wiki/{node_token})`
   - 扣子环境：`[文本](./folder/file.md)`

---

## 📦 安装说明（人类指南）

### 环境一：飞书 Wiki（推荐团队使用）

#### 前置要求
- 飞书企业账号
- Wiki 空间管理员权限
- 云空间文件夹访问权限

#### 安装步骤

1. **创建 Wiki 空间**
   ```
   飞书 → Wiki → 创建空间 → LLM-wiki
   记录 space_id: 7633348949482589405
   ```

2. **准备文件夹**
   ```
   云空间 → LLM-wiki/
   ├── 待处理/     # 放置待摄取文档
   └── 已归档/     # 自动归档目录
   ```

3. **配置权限**
   - 确保应用有 Wiki 编辑权限
   - 确保有云空间文件操作权限

4. **使用 Skill**
   ```
   触发词："摄取文档"、"整理知识库"
   ```

#### 文件结构
```
飞书 Wiki Space/
├── 首页（手动创建）
├── 主题页（自动创建）
│   └── 子文档（实体/归档）
└── 系统页
```

---

### 环境二：扣子智能体（推荐个人/Agent 使用）

#### 前置要求
- 扣子智能体账号
- Workspace 访问权限

#### 安装步骤

1. **创建工作目录**
   ```bash
   mkdir -p {workspace}/input
   mkdir -p {workspace}/asset
   mkdir -p {workspace}/wiki/topics
   mkdir -p {workspace}/wiki/entities
   mkdir -p {workspace}/wiki/archive
   mkdir -p {workspace}/wiki/system
   ```

2. **初始化基础文件**
   
   创建 `wiki/system/log.md`：
   ```markdown
   # LLM Wiki - Log
   
   ## [2026-04-27] init | 系统初始化
   - 创建目录结构
   ```

   创建 `wiki/system/index.md`：
   ```markdown
   # 系统索引
   
   ## 📚 主题清单
   | 主题 | 文档数 | 实体数 |
   |------|--------|--------|
   | [Agent 架构体系](./topics/Agent%20架构体系.md) | 0 | 0 |
   ```

3. **配置路径**
   ```javascript
   const PATHS = {
     input: '{workspace}/input',   // 待处理
     asset: '{workspace}/asset',   // 已归档
     wiki: '{workspace}/wiki'
   };
   ```

4. **使用方式**
   ```
   1. 将文档放入 input/ 目录
   2. 运行摄取脚本
   3. 查看 wiki/ 目录生成的页面
   ```

#### 文件结构
```
{workspace}/
├── input/              # 待处理文档
├── asset/              # 已归档文档
└── wiki/
    ├── topics/         # 主题聚合页
    ├── entities/       # 实体百科
    ├── archive/        # 归档文档
    └── system/         # 系统页面
```

---

## 🤖 LLM 使用指南（智能体场景）

### 适用场景

1. **个人知识管理**
   - 读取本地文档
   - 自动整理知识结构
   - 无需飞书依赖

2. **Agent 内部知识库**
   - 为 AI Agent 构建专属知识库
   - 支持动态摄取和更新
   - 文件级访问控制

3. **离线环境**
   - 无网络依赖
   - 纯本地文件操作
   - 快速响应

### 与飞书环境的区别

| 特性 | 飞书环境 | 扣子智能体 |
|------|---------|-----------|
| **存储位置** | 飞书 Wiki 空间 | Workspace 本地文件夹 |
| **访问方式** | Web/APP | 文件系统直接访问 |
| **待处理/已归档** | 飞书云空间文件夹 | `input/` / `asset/` |
| **API 调用** | `feishu_create_doc` | `fs.writeFile` |
| **层级构建** | `feishu_wiki_space_node move` | `fs.mkdir` |
| **链接格式** | `https://www.feishu.cn/wiki/{token}` | `./folder/file.md` |
| **协作共享** | 团队成员可访问 | 限于智能体范围 |
| **部署复杂度** | 需要授权和配置 | 开箱即用 |

### 智能体专用配置

```javascript
// 扣子环境配置示例
const CozeConfig = {
  paths: {
    input: '/workspace/input',      // 待处理文档
    asset: '/workspace/asset',      // 归档文档
    wiki: '/workspace/wiki'         // 知识库根目录
  },
  
  // 本地文件操作替代飞书 API
  operations: {
    createDoc: (path, content) => fs.writeFile(path, content),
    moveDoc: (from, to) => fs.rename(from, to),
    readDoc: (path) => fs.readFile(path, 'utf-8')
  },
  
  // 相对路径链接生成
  generateLink: (fileName, folder) => {
    return `[${fileName}](./${folder}/${encodeURIComponent(fileName)}.md)`;
  }
};
```

### 触发方式

**飞书环境**：
```
用户："摄取文档"
LLM：执行 feishu_drive_file list → feishu_create_doc → feishu_wiki_space_node move
```

**扣子环境**：
```
用户："摄取文档"
LLM：执行 fs.readdir → fs.writeFile → fs.rename
```

---

## 🚀 快速开始

### 飞书环境快速开始

1. 在 `LLM-wiki/待处理/` 放入文档
2. 发送消息："摄取文档"
3. LLM 自动执行完整流程
4. 访问 Wiki 空间查看结果

### 扣子环境快速开始

1. 将文档放入 `{workspace}/input/`
2. 运行摄取脚本或发送指令
3. 查看 `{workspace}/wiki/` 生成的页面
4. 归档文档自动移动到 `asset/`

---

## ⚙️ 配置说明

### 主题关键词配置

```javascript
const TOPIC_KEYWORDS = {
  'Agent 架构体系': [
    '星形架构', 'main agent', 'sub agent', 
    '多agent', 'agent协作', '调度', 'langgraph'
  ],
  '可观测性与追踪': [
    'langsmith', '追踪', '监控', '可观测',
    'projectid', 'traceid', 'runid', '链路'
  ],
  '前后端协作规范': [
    'stream', '前后端', '事件流', '状态流',
    'sse', 'websocket', '协作'
  ]
};
```

### 实体识别配置

```javascript
const ENTITY_LIST = [
  'DeepAgents', 'LangChain', 'LangSmith',
  'Main Agent', 'Sub Agent',
  '事件流', '星形架构', '全链路追踪'
];
```

---

## 📚 相关文档

- [SKILL.md](./SKILL.md) - 完整功能说明和 API 文档
- [INSTALL_COZE.md](./INSTALL_COZE.md) - 扣子智能体详细安装指南
- [UPDATE_LOG.md](./UPDATE_LOG.md) - 更新日志

---

## 🤝 贡献指南

欢迎提交 Issue 和 PR！

---

## 📄 License

MIT License

---

**适用版本**: llm-wiki-ingest v1.0+

**最后更新**: 2026-04-27
