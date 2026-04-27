# LLM Wiki Ingest

> 自动化知识库摄取系统 - 将非结构化文档转化为结构化主题-实体-归档三层知识库

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](./UPDATE_LOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## 📋 什么是 LLM Wiki Ingest？

LLM Wiki Ingest 是一个**智能文档摄取系统**，专为 LLM/AI Agent 设计，能够自动处理各种格式的文档，提取关键知识，并构建结构化的**主题-实体-归档**三层知识库。

### 核心问题它解决

1. **文档碎片化** → 统一归档，保留完整溯源链路
2. **知识难以检索** → 主题聚合，一次查询获取完整上下文
3. **实体概念混乱** → 原子化定义，建立清晰关联
4. **格式不兼容** → 统一 Markdown 格式，支持飞书/扣子双环境

---

## 🎯 核心逻辑（How it works）

### 三层知识库架构

```
┌─────────────────────────────────────────────────────────┐
│                    LLM Wiki 知识库                       │
├─────────────────────────────────────────────────────────┤
│  第一层：主题聚合（Topics）                               │
│  ├── Agent 架构体系                                       │
│  ├── 可观测性与追踪                                       │
│  └── 前后端协作规范                                       │
│  【作用】按查询场景组织，一次查询获得完整上下文              │
├─────────────────────────────────────────────────────────┤
│  第二层：实体百科（Entities）                             │
│  ├── DeepAgents, LangChain, LangSmith                    │
│  ├── Main Agent, Sub Agent                               │
│  └── 事件流, 星形架构, 全链路追踪                         │
│  【作用】原子化概念定义，多处引用保持一致                    │
├─────────────────────────────────────────────────────────┤
│  第三层：归档文档（Archive）                              │
│  ├── 动态星形多Agent架构部署方案                         │
│  ├── DeepAgents Stream状态流及前后端对接                 │
│  └── MeowBot 接入 LangSmith                              │
│  【作用】保留原始文档完整内容，支持溯源                     │
└─────────────────────────────────────────────────────────┘
```

### 处理流程（10步摄取）

```
待处理文档
    ↓
1. 读取文档 → 提取原始内容
    ↓
2. 主题分类 → 关键词匹配到3个固定主题之一
    ↓
3. 实体提取 → 分层策略（规则+LLM+过滤），防概念爆炸
    ↓
4. 动态链接 → 扫描文件系统构建链接映射
    ↓
5. 更新主题页 → 追加来源文档和实体引用
    ↓
6. 创建/更新实体页 → 原子化定义，建立关联
    ↓
7. 创建归档页 → 保留完整原文，提取摘要
    ↓
8. 建立层级 → 实体/归档作为主题子文档
    ↓
9. 更新索引 → 统计信息和全局导航
    ↓
10. 归档源文档 → 移动到已归档文件夹
    ↓
✅ 完成
```

### 关键技术决策

#### 1. 为什么主题固定，实体动态？

| 方面 | 主题 | 实体 |
|------|------|------|
| **稳定性** | 固定3个主题，保持结构清晰 | 动态识别，适应新概念 |
| **扩展性** | 人工审核后添加，避免过度分类 | 自动提取，技术演进自然增长 |
| **查询体验** | 主题作为入口，快速定位 | 实体作为详情，深入理解 |

#### 2. 实体提取如何防概念爆炸？

**三层过滤策略**:
```
规则层（零成本）
├── 精确匹配已知实体列表
├── 正则提取特定模式（如"XX Agent"）
└── 频率检查（≥2次）

LLM层（有约束）
├── 最多提取3个新实体
├── 置信度阈值≥0.7
├── 禁止提取通用词汇
└── 与已有实体相似度<0.8

过滤层（兜底）
├── 长度<30字符
├── 黑名单过滤
└── 人工审核全新实体
```

#### 3. 为什么使用动态链接映射？

**问题**: 硬编码实体列表难以维护，新增实体需手动更新映射

**解决**: 运行时动态扫描文件系统
```javascript
// 自动扫描构建映射，零维护成本
const linkMap = await buildLinkMap('./wiki');
// { 'DeepAgents': './entities/DeepAgents.md', ... }
```

---

## 🚀 安装方式

### 方式一：飞书 Wiki 环境（团队协作）

**适用场景**: 团队共享知识库，多人协作编辑

#### 前置要求
- 飞书企业账号
- Wiki 空间管理员权限
- 云空间文件夹访问权限

#### 快速安装

```bash
# 1. 创建 Wiki 空间
# 飞书 → Wiki → 创建空间 → LLM-wiki
# 记录 space_id: 7633348949482589405

# 2. 准备云空间文件夹结构
LLM-wiki/
├── 待处理/     # 放置待摄取文档（token: S7JbfzAKHlCxpbdazqicUdmjnGe）
└── 已归档/     # 自动归档目录（token: FzubfNFlIlgFSDdVdE4coKCbnYg）

# 3. 配置权限
# - 应用有 Wiki 编辑权限
# - 有云空间文件操作权限
```

#### 使用方式

```
用户发送："摄取文档" 或 "整理知识库"

系统自动执行：
1. 读取 LLM-wiki/待处理/ 文件夹
2. 分类 → 提取 → 生成页面
3. 建立父子层级关系
4. 移动文档到 已归档/
5. 返回处理结果摘要
```

---

### 方式二：扣子智能体环境（个人/Agent）

**适用场景**: 个人知识管理、Agent 内部知识库、离线环境

#### 前置要求
- 扣子智能体账号
- Workspace 访问权限

#### 快速安装

```bash
# 1. 创建工作目录
mkdir -p llm-wiki
cd llm-wiki

# 2. 初始化目录结构
mkdir -p input asset wiki/{topics,entities,archive,system}

# 3. 创建初始系统文件

# wiki/system/log.md
cat > wiki/system/log.md << 'EOF'
# LLM Wiki - Log

## [$(date +%Y-%m-%d)] init | 系统初始化
- 创建目录结构
EOF

# wiki/system/index.md
cat > wiki/system/index.md << 'EOF'
# 系统索引

## 📊 统计
- 主题页面：3
- 实体页面：0
- 归档页面：0

## 📚 主题清单
| 主题 | 文档数 | 实体数 |
|------|--------|--------|
| [Agent 架构体系](./topics/Agent%20架构体系.md) | 0 | 0 |
| [可观测性与追踪](./topics/可观测性与追踪.md) | 0 | 0 |
| [前后端协作规范](./topics/前后端协作规范.md) | 0 | 0 |
EOF

# wiki/00-首页.md
cat > wiki/00-首页.md << 'EOF'
# LLM Wiki 首页

## 📚 主题导航
- [Agent 架构体系](./topics/Agent%20架构体系.md)
- [可观测性与追踪](./topics/可观测性与追踪.md)
- [前后端协作规范](./topics/前后端协作规范.md)

## 🔧 系统
- [系统索引](./system/index.md)
- [操作日志](./system/log.md)
EOF

# 4. 安装核心组件
git clone https://github.com/LericHub/skill-rep.git
cp skill-rep/llm-wiki-ingest/references/*.js ./
```

#### 使用方式

```bash
# 1. 放入待处理文档
cp /path/to/document.md input/

# 2. 运行摄取（手动或触发）
node ingest.js

# 3. 查看生成的页面
ls wiki/topics/      # 主题聚合页
ls wiki/entities/    # 实体百科页
ls wiki/archive/     # 归档文档页

# 4. 源文档自动归档到 asset/
ls asset/
```

---

## 🔧 核心组件

### 1. 实体提取器 (`entity-extractor.js`)

**功能**: 分层实体识别，防概念爆炸

**特性**:
- ✅ 规则层：零LLM开销，精准匹配
- ✅ LLM层：有约束提取，最多3个
- ✅ 过滤层：长度/频率/相似度检查
- ✅ 审核层：全新实体需人工确认

**使用**:
```javascript
const { extractEntities } = require('./entity-extractor.js');

const entities = await extractEntities(content, {
  existingEntities: ['DeepAgents', 'LangChain'],
  useLLM: true,
  requireApproval: true
});
```

### 2. 链接构建器 (`link-builder.js`)

**功能**: 动态扫描文件系统，生成正确链接

**特性**:
- ✅ 运行时扫描，零硬编码
- ✅ 支持本地路径和飞书URL
- ✅ 自动修复 `[[...]]` 格式
- ✅ 批量处理整个目录

**使用**:
```javascript
const { buildLinkMap, fixAllWikiLinks } = require('./link-builder.js');

const linkMap = await buildLinkMap('./wiki');
await fixAllWikiLinks('./wiki', { format: 'local' });
```

---

## 📚 文档索引

| 文档 | 说明 | 适用读者 |
|------|------|---------|
| [README.md](./README.md) | 项目概述与快速开始 | 所有人 |
| [SKILL.md](./SKILL.md) | 完整功能说明与API | 开发者 |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | OpenClaw+飞书环境实现指南 | OpenClaw/飞书开发者 |
| [COZE_AGENT_GUIDE.md](./COZE_AGENT_GUIDE.md) | 扣子智能体环境实现指南 | 扣子开发者 |
| [UPDATE_LOG.md](./UPDATE_LOG.md) | 更新日志 | 维护者 |

### 如何选择合适的指南？

**根据你的环境选择**：

| 你的环境 | 推荐指南 | 原因 |
|---------|---------|------|
| **OpenClaw + 飞书 Wiki** | [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | 详细说明如何使用飞书API，包括feishu_create_doc、feishu_wiki_space_node等调用方式 |
| **扣子智能体** | [COZE_AGENT_GUIDE.md](./COZE_AGENT_GUIDE.md) | 详细说明如何使用本地文件系统，纯本地运行，无需飞书权限 |

**根据你的目的选择**：

| 你的目的 | 推荐指南 | 内容 |
|---------|---------|------|
| **快速了解项目** | [README.md](./README.md)（本页） | 核心逻辑、安装方式、快速开始 |
| **复现/移植功能** | [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) 或 [COZE_AGENT_GUIDE.md](./COZE_AGENT_GUIDE.md) | 完整的代码实现、模块说明、配置细节 |
| **查看API参考** | [SKILL.md](./SKILL.md) | 所有工具、参数、返回值说明 |

---

## 🆚 环境对比

| 特性 | 飞书 Wiki | 扣子智能体 |
|------|-----------|-----------|
| **存储位置** | 飞书 Wiki 空间 | Workspace 本地文件夹 |
| **访问方式** | Web/APP + API | 文件系统直接访问 |
| **网络依赖** | 需要飞书 API | 纯本地，无需网络 |
| **协作共享** | 团队可访问 | 限于智能体范围 |
| **部署复杂度** | 需授权配置 | 开箱即用 |
| **链接格式** | `https://www.feishu.cn/wiki/{token}` | `./folder/file.md` |
| **层级构建** | API `move` 操作 | 文件夹嵌套 |
| **适用场景** | 团队协作 | 个人/Agent/离线 |

---

## 🎯 快速开始

### 飞书环境（3步）

```
1. 在 LLM-wiki/待处理/ 放入文档
2. 发送消息："摄取文档"
3. 查看 Wiki 空间结果
```

### 扣子环境（3步）

```bash
1. cp document.md input/
2. node ingest.js
3. cat wiki/topics/*.md
```

---

## 💡 典型使用场景

### 场景1：技术文档整理

**输入**: 10篇关于 Agent 架构的技术文档

**输出**:
- 1个主题页：Agent 架构体系（聚合所有内容）
- 5个实体页：DeepAgents, Main Agent, Sub Agent, 星形架构, 事件流
- 10个归档页：每篇原文档完整保留

**收益**: 问"Main Agent 职责" → 直接定位到实体页，一次查询获得定义、来源、关联

### 场景2：产品知识库

**输入**: 产品需求文档、设计稿、会议纪要

**输出**:
- 主题页：前后端协作规范
- 实体页：产品概念、技术组件
- 归档页：可追溯所有原始文档

**收益**: 新人入职 → 阅读主题页快速理解全貌

### 场景3：Agent 内部知识库

**输入**: 工具使用说明、API 文档、最佳实践

**输出**:
- 结构化知识库供 Agent 查询
- 无需外部依赖，纯本地运行

**收益**: Agent 自主查询知识 → 减少对外部搜索的依赖

---

## 🤝 贡献指南

欢迎提交 Issue 和 PR！

1. Fork 仓库
2. 创建特性分支：`git checkout -b feature/xxx`
3. 提交更改：`git commit -am 'Add xxx'`
4. 推送分支：`git push origin feature/xxx`
5. 创建 Pull Request

---

## 📄 License

MIT License - 详见 [LICENSE](./LICENSE)

---

## 📞 支持与反馈

- GitHub Issues: https://github.com/LericHub/skill-rep/issues
- 飞书 Wiki: https://www.feishu.cn/wiki/space/7633348949482589405

---

**版本**: v2.0 | **最后更新**: 2026-04-27

**关键词**: 知识库, 文档摄取, 实体提取, 主题聚合, LLM, Agent, 飞书, 扣子
