# LLM Wiki Ingest - OpenClaw + 飞书环境实现指南

> ⚠️ **环境说明**: 本指南专门针对 **OpenClaw + 飞书 Wiki** 环境
> 
> 如果你使用扣子智能体环境，请参考 [COZE_AGENT_GUIDE.md](./COZE_AGENT_GUIDE.md)

> 本指南面向在 OpenClaw 平台上使用飞书 Wiki 集成的开发者，详细描述如何在该环境下实现本 Skill 的功能

---

## 📋 概述

LLM Wiki Ingest 是一个自动化知识库摄取系统，能够将非结构化文档转化为结构化的主题-实体-归档三层知识库。

**本指南适用的环境**:
- ✅ OpenClaw Agent 平台
- ✅ 飞书 Wiki 集成
- ✅ 飞书云空间文件夹访问
- ✅ 飞书 API 调用权限（feishu_create_doc, feishu_wiki_space_node 等）

**核心能力**：
- 📄 自动文档摄取与解析
- 🏷️ 智能主题分类与实体提取
- 🔗 动态链接生成与层级构建
- 🗂️ 归档管理与溯源追踪

---

## 🏗️ 系统架构

### 数据流

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   输入层      │ → │   处理层      │ → │   存储层      │
│  (待处理文档)  │    │ (提取/分类)   │    │ (Wiki结构)   │
└──────────────┘    └──────────────┘    └──────────────┘
                           ↓
                    ┌──────────────┐
                    │   输出层      │
                    │ (主题/实体/归档)│
                    └──────────────┘
```

### 核心模块

```
llm-wiki-ingest/
├── 1. 文档摄取模块      # 读取待处理文档
├── 2. 内容分析模块      # 主题分类 + 实体提取
├── 3. 页面生成模块      # 创建主题页/实体页/归档页
├── 4. 链接管理模块      # 动态链接映射与修复
├── 5. 层级构建模块      # 建立父子关系
└── 6. 系统维护模块      # 更新索引与日志
```

---

## 📚 模块详细说明

### 模块 1: 文档摄取

**功能**: 从飞书云空间 `待处理` 文件夹读取文档，提取原始内容

**环境**: OpenClaw 通过飞书 API 访问云空间

**输入**:
- 飞书云空间文件夹 Token: `S7JbfzAKHlCxpbdazqicUdmjnGe`
- 支持的格式: docx, doc, bitable, sheet

**OpenClaw API 调用**:
```javascript
// 在 OpenClaw 环境中使用 feishu_drive_file 工具
const result = await feishu_drive_file({
  action: 'list',
  folder_token: 'S7JbfzAKHlCxpbdazqicUdmjnGe'
});
```

**输出**:
```javascript
{
  documents: [
    {
      id: "doc_001",
      title: "动态星形多Agent架构部署方案",
      content: "完整文档内容...",
      format: "docx",
      source: "feishu://folder/xxx/file/xxx",
      timestamp: "2026-04-27T10:00:00Z"
    }
  ]
}
```

**实现逻辑**:
1. 调用 `feishu_drive_file list` 扫描待处理文件夹
2. 识别支持的文档格式
3. 调用 `feishu_fetch_doc` 读取文档内容
4. 统一转换为 Markdown 格式
5. 保存到临时目录（raw/）

---

### 模块 2: 内容分析

#### 2.1 主题分类

**功能**: 将文档归类到预定义的主题

**主题定义**:
```javascript
const TOPICS = {
  'Agent 架构体系': {
    keywords: ['星形架构', 'main agent', 'sub agent', '多agent', 'agent协作', '调度', 'langgraph'],
    description: '多Agent协作架构、调度机制、角色定义'
  },
  '可观测性与追踪': {
    keywords: ['langsmith', '追踪', '监控', '可观测', 'projectid', 'traceid', 'runid', '链路'],
    description: 'LLM应用可观测性、链路追踪、性能监控'
  },
  '前后端协作规范': {
    keywords: ['stream', '前后端', '事件流', '状态流', 'sse', 'websocket', '协作'],
    description: '前后端通信协议、事件流机制、协作规范'
  }
};
```

**分类算法**:
```javascript
function classifyTopic(document) {
  const content = document.content.toLowerCase();
  const scores = {};
  
  for (const [topic, config] of Object.entries(TOPICS)) {
    scores[topic] = 0;
    for (const keyword of config.keywords) {
      const matches = content.match(new RegExp(keyword, 'gi'));
      if (matches) scores[topic] += matches.length;
    }
  }
  
  // 返回得分最高的主题
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return {
    primary: sorted[0][0],
    confidence: sorted[0][1] / Math.max(1, sorted[1][1]),
    scores
  };
}
```

**分类决策**:
- 如果最高得分 ≥ 3，确定分类
- 如果最高得分 < 3，标记为"待分类"，需要人工确认
- 如果两个主题得分接近（差距 < 2），标记为"跨主题"，归入两个主题

#### 2.2 实体提取

**功能**: 从文档中提取关键实体（框架、工具、概念）

**提取策略（分层）**:

**第一层：规则匹配**（零成本，高精度）
```javascript
// 已知实体列表（可扩展）
const KNOWN_ENTITIES = [
  'DeepAgents', 'LangChain', 'LangSmith',
  'Main Agent', 'Sub Agent',
  '事件流', '星形架构', '全链路追踪'
];

function ruleBasedExtraction(content) {
  const found = [];
  for (const entity of KNOWN_ENTITIES) {
    const regex = new RegExp(`\\b${escapeRegex(entity)}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length >= 2) {
      found.push({
        name: entity,
        frequency: matches.length,
        source: 'exact_match',
        confidence: 1.0
      });
    }
  }
  return found;
}
```

**第二层：LLM提取**（处理新实体，有约束）
```javascript
const LLM_PROMPT = `从以下文档中提取关键实体（框架、工具、平台、核心概念）。

【已有实体】（不要重复）：${existingEntities.join(', ')}

【提取标准】
1. 必须是技术实体：框架、工具、平台、协议、设计模式
2. 在文档中出现≥2次或有专门章节介绍
3. 与已有实体语义不重复

【禁止提取】
- 通用词汇：系统、功能、方法、流程、模块
- 已有实体的变体
- 过于细粒度的实现细节

【输出限制】
最多提取 3 个新实体，JSON格式：
[{"name": "实体名", "type": "框架|工具|概念", "definition": "一句话定义", "confidence": 0.95}]

文档内容：
${content.substring(0, 3000)}`;

async function llmBasedExtraction(content, existingEntities) {
  const result = await llm.call(LLM_PROMPT);
  const entities = JSON.parse(result);
  
  return entities
    .filter(e => e.confidence >= 0.7)
    .filter(e => e.name.length <= 30)
    .filter(e => !isBlacklisted(e.name))
    .slice(0, 3);
}
```

**第三层：过滤与审核**
```javascript
function filterEntities(entities) {
  return entities.filter(e => {
    // 长度检查
    if (e.name.length > 30) return false;
    
    // 频率检查（非LLM提取的实体）
    if (e.source !== 'llm_extracted' && e.frequency < 2) return false;
    
    // 黑名单检查
    const blacklist = ['系统', '功能', '方法', '流程', '模块'];
    if (blacklist.includes(e.name)) return false;
    
    // 相似度检查（与已知实体相似度>0.8的合并）
    for (const known of KNOWN_ENTITIES) {
      if (similarity(e.name, known) > 0.8) return false;
    }
    
    return true;
  });
}

// 全新实体需要人工审核
function requiresApproval(entity) {
  return entity.source === 'llm_extracted' && 
         !KNOWN_ENTITIES.includes(entity.name);
}
```

**输出**:
```javascript
{
  entities: [
    {
      name: "LangSmith",
      type: "工具",
      definition: "LangChain官方可观测性工具",
      frequency: 5,
      confidence: 0.95,
      source: "exact_match|llm_extracted",
      requiresApproval: false
    }
  ]
}
```

---

### 模块 3: 页面生成

#### 3.1 主题聚合页

**功能**: 整合某一主题下的所有相关信息

**页面结构**:
```markdown
# {主题名称}

**最后更新**: {日期}
**文档数**: {N}
**实体数**: {N}

---

## 📝 核心概念摘要
{200-300字主题概述}

---

## 🔗 关键实体
| 实体 | 类型 | 一句话定义 |
|------|------|-----------|
| [实体名](链接) | 框架 | 定义 |

---

## 📚 知识点
### {日期} - {文档标题}
- 要点1
- 要点2
- 要点3

---

## 📦 来源文档
- [文档标题](链接) - 摘要

---

## 🎯 快速查询
**问**: "常见问题?"
**答**: 见本文档"{章节}"部分
```

**生成逻辑**:
1. 提取主题下的所有实体
2. 提取主题下的所有归档文档
3. 生成实体表格（带链接）
4. 按时间倒序排列知识点
5. 添加快速查询QA

#### 3.2 实体百科页

**功能**: 原子化实体定义

**页面结构**:
```markdown
# {实体名称}

**实体类型**: {框架|工具|概念|组件}
**创建时间**: {日期}
**最后更新**: {日期}

## 📝 描述
{详细描述}

## 📚 信息来源
- [文档标题](链接) - 描述

## 🔗 相关实体
- [实体名](链接) - 关系描述

## 💡 核心特性
- 特性1
- 特性2
```

**生成逻辑**:
1. 从文档中提取实体相关段落
2. 生成一句话定义
3. 提取提及该实体的所有文档
4. 提取相关实体（同一文档中出现的其他实体）

#### 3.3 归档文档页

**功能**: 保留原始文档的完整内容

**页面结构**:
```markdown
**来源**: [查看原文](原始链接)
**摄取时间**: {日期时间}
**文档类型**: {docx/md/txt}
**所属主题**: [主题名](链接)

## 📋 核心摘要
{摘要}

## 🔗 生成的实体
- [实体名](链接)

## 💭 概念关联
- [有页面的概念](链接)
- 纯文本概念（无页面）

## 📚 知识点
{要点}

## ❓ 开放问题
1. 问题1
2. 问题2

## 📄 完整内容
{完整文档内容}
```

**生成逻辑**:
1. 保留原始文档的完整内容
2. 提取核心摘要（LLM生成）
3. 列出文档中生成的实体
4. 提取概念关联（有页面的加链接，无页面的纯文本）
5. 生成开放问题（LLM基于内容生成）

---

### 模块 4: 链接管理

**功能**: 动态生成和管理页面间的链接

**核心问题**: 如何在不硬编码的情况下，正确链接到已存在的页面？

**解决方案**: 运行时动态扫描

```javascript
// 动态构建链接映射
async function buildLinkMap(basePath) {
  const linkMap = {};
  
  // 扫描实体文件夹
  const entityFiles = await fs.readdir(`${basePath}/entities/`);
  for (const file of entityFiles) {
    const name = path.basename(file, '.md');
    linkMap[name] = {
      name,
      type: 'entity',
      localPath: `./entities/${encodeURIComponent(file)}`,
      // 飞书环境需要 node_token
      nodeToken: null // 从飞书API获取
    };
  }
  
  // 同理扫描 topics/, archive/, system/
  
  return linkMap;
}

// 生成本地格式链接
function generateLocalLink(name, linkMap) {
  const entry = linkMap[name];
  if (!entry) return name; // 无页面时返回纯文本
  return `[${name}](${entry.localPath})`;
}

// 生成飞书格式链接
function generateFeishuLink(name, linkMap) {
  const entry = linkMap[name];
  if (!entry || !entry.nodeToken) return name;
  return `[${name}](https://www.feishu.cn/wiki/${entry.nodeToken})`;
}
```

**链接修复**: 将 `[[实体名]]` 转换为标准 Markdown
```javascript
async function fixWikiLinks(content, linkMap, format = 'local') {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  
  return content.replace(wikiLinkRegex, (match, name) => {
    const link = format === 'feishu' 
      ? generateFeishuLink(name, linkMap)
      : generateLocalLink(name, linkMap);
    return link || match; // 找不到映射时保持原样
  });
}
```

---

### 模块 5: 层级构建

**功能**: 建立页面间的父子关系

**层级规则**:
```
Wiki 空间（根）
├── 首页（根节点）
├── 主题页（根节点）
│   └── 实体页/归档页（子节点）
├── 归档索引（根节点）
│   └── 归档页（子节点）
└── 系统页（根节点）
```

**映射关系**:
```javascript
const TOPIC_ENTITY_MAPPING = {
  'Agent 架构体系': [
    'DeepAgents', 'LangChain', 'Main Agent', 'Sub Agent',
    '星形架构', '事件流',
    '动态星形多Agent架构（类Claude Agent Teams）部署方案'
  ],
  '可观测性与追踪': [
    'LangSmith', '全链路追踪',
    'MeowBot 接入 LangSmith'
  ],
  '前后端协作规范': [
    'DeepAgents Stream状态流及前后端对接'
  ]
};
```

**OpenClaw 实现步骤**:
1. 创建主题页（根节点）- 使用 `feishu_create_doc`
2. 创建实体页/归档页 - 使用 `feishu_create_doc`
3. 将实体页/归档页移动到对应主题下 - 使用 `feishu_wiki_space_node move`

**OpenClaw API 调用示例**:
```javascript
// 1. 创建主题页
const topicResult = await feishu_create_doc({
  title: 'Agent 架构体系',
  markdown: topicContent,
  wiki_space: '7633348949482589405'
});
const topicNodeToken = topicResult.doc_id;

// 2. 创建实体页
const entityResult = await feishu_create_doc({
  title: 'DeepAgents',
  markdown: entityContent,
  wiki_space: '7633348949482589405'
});
const entityNodeToken = entityResult.doc_id;

// 3. 建立父子关系（将实体页移动到主题下）
await feishu_wiki_space_node({
  action: 'move',
  node_token: entityNodeToken,
  target_parent_token: topicNodeToken,
  target_space_id: '7633348949482589405'
});
```

---

### 模块 6: 系统维护

#### 6.1 系统索引更新

**功能**: 维护全局索引页面

**更新内容**:
- 统计：主题数、实体数、归档数
- 主题清单：链接到各主题页
- 实体清单：实体 → 主题的映射表
- 归档清单：按时间倒序排列

#### 6.2 操作日志

**功能**: 记录所有摄取操作

**日志格式**:
```markdown
## [{日期时间}] ingest | {文档标题}

- 来源: {原始链接}
- 处理时间: {耗时}
- 识别主题: {主题名}
- 生成/更新实体: {实体列表}
- 创建归档页: {归档页链接}
```

---

## 🔧 OpenClaw 完整工作流程

以下是在 OpenClaw 环境中使用飞书 API 的完整摄取流程：

```javascript
async function ingestDocument(fileToken) {
  // 1. 读取文档（OpenClaw 调用飞书 API）
  const docMeta = await feishu_drive_file({
    action: 'get_meta',
    file_token: fileToken,
    type: 'docx'
  });
  
  const docContent = await feishu_fetch_doc({
    doc_id: fileToken
  });
  
  const doc = {
    title: docMeta.title,
    content: docContent.markdown,
    source: `feishu://file/${fileToken}`
  };
  
  // 2. 主题分类
  const { primary: topic } = classifyTopic(doc);
  
  // 3. 实体提取（使用 LLM）
  const entities = await extractEntities(doc.content, {
    useLLM: true,
    requireApproval: false  // OpenClaw 环境自动处理
  });
  
  // 4. 构建链接映射（从已创建的飞书页面获取 node_tokens）
  const linkMap = await buildLinkMapFromFeishu('7633348949482589405');
  
  // 5. 生成/更新页面（OpenClaw 调用 feishu_create_doc）
  
  // 5.1 更新主题页
  const topicNodeToken = await getTopicNodeToken(topic);
  const updatedTopicContent = generateTopicContent(topic, doc, entities, linkMap);
  await feishu_update_doc({
    doc_id: topicNodeToken,
    markdown: updatedTopicContent,
    mode: 'overwrite'
  });
  
  // 5.2 创建/更新实体页
  for (const entity of entities) {
    const entityContent = generateEntityContent(entity, doc, linkMap);
    const entityResult = await feishu_create_doc({
      title: entity.name,
      markdown: entityContent,
      wiki_space: '7633348949482589405'
    });
    
    // 记录 entity node_token 用于后续链接
    linkMap[entity.name] = {
      ...linkMap[entity.name],
      nodeToken: entityResult.doc_id
    };
  }
  
  // 5.3 创建归档页
  const archiveContent = generateArchiveContent(doc, entities, linkMap, topic);
  const archiveResult = await feishu_create_doc({
    title: doc.title,
    markdown: archiveContent,
    wiki_space: '7633348949482589405'
  });
  
  // 6. 建立层级关系（OpenClaw 调用 feishu_wiki_space_node）
  const topicEntityMap = getTopicEntityMapping();
  
  // 将实体页移动到主题下
  for (const entity of entities) {
    if (linkMap[entity.name]?.nodeToken) {
      await feishu_wiki_space_node({
        action: 'move',
        node_token: linkMap[entity.name].nodeToken,
        target_parent_token: topicNodeToken,
        target_space_id: '7633348949482589405'
      });
    }
  }
  
  // 将归档页移动到归档索引下
  const archiveIndexToken = 'Xi8twf6Jgii59VkGpgkcnVbCnCe';
  await feishu_wiki_space_node({
    action: 'move',
    node_token: archiveResult.doc_id,
    target_parent_token: archiveIndexToken,
    target_space_id: '7633348949482589405'
  });
  
  // 7. 更新系统索引
  await updateSystemIndex(linkMap);
  
  // 8. 记录日志（本地或飞书文档）
  await appendLog(doc, topic, entities);
  
  // 9. 归档源文档（移动到飞书已归档文件夹）
  await feishu_drive_file({
    action: 'move',
    file_token: fileToken,
    folder_token: 'FzubfNFlIlgFSDdVdE4coKCbnYg',
    type: 'doc'
  });
  
  return { topic, entities, archivePage: archiveResult };
}
```

---

## 🔧 OpenClaw 环境配置

### 必需的 OpenClaw 配置

在 OpenClaw 的 `config.yaml` 中需要配置以下飞书相关插件：

```yaml
plugins:
  entries:
    feishu:
      config:
        appId: "cli_xxxxxxxxxxxxxxxx"      # 飞书应用 ID
        appSecret: "xxxxxxxxxxxxxxxx"      # 飞书应用密钥
        encryptKey: "xxxxxxxxxxxxxxxx"     # 加密密钥（可选）
        verificationToken: "xxxxxxxxxx"    # 验证 Token（可选）
```

### OpenClaw 环境特有的工具

| 工具 | 用途 | OpenClaw 调用方式 |
|------|------|------------------|
| `feishu_drive_file` | 云空间文件管理 | `feishu_drive_file({ action: 'list', folder_token: 'xxx' })` |
| `feishu_fetch_doc` | 获取文档内容 | `feishu_fetch_doc({ doc_id: 'xxx' })` |
| `feishu_create_doc` | 创建飞书文档 | `feishu_create_doc({ title: 'xxx', markdown: 'xxx' })` |
| `feishu_update_doc` | 更新飞书文档 | `feishu_update_doc({ doc_id: 'xxx', markdown: 'xxx' })` |
| `feishu_wiki_space_node` | Wiki 节点管理 | `feishu_wiki_space_node({ action: 'move', node_token: 'xxx' })` |

### 飞书 Wiki 空间配置

```javascript
const FEISHU_CONFIG = {
  // Wiki 空间 ID
  spaceId: '7633348949482589405',
  
  // 文件夹 Tokens
  folders: {
    pending: 'S7JbfzAKHlCxpbdazqicUdmjnGe',    // 待处理
    archived: 'FzubfNFlIlgFSDdVdE4coKCbnYg'   // 已归档
  },
  
  // 已知页面 node_tokens（用于更新）
  pages: {
    home: 'Kq2kwch3zig5ufk6ShDcMjXlni8',
    agentArchitecture: 'KrqKwcqkOiEZR9kMvMEcZnnonJf',
    observability: 'HK1Dw0u31ifsprkrAnhcOVKFnSc',
    collaboration: 'XQwfwWNleiqkhVkCjs7cmzw8nKe',
    archiveIndex: 'Xi8twf6Jgii59VkGpgkcnVbCnCe',
    systemIndex: 'GjKnwQGwhiRyrmkL2OVcquXEn3g',
    log: 'INnDwnmjDi9YRTkR94qc6DYEnLg'
  }
};
```

---

## 💡 关键设计决策

### 1. 为什么主题固定，实体动态？

**主题固定**:
- 保持知识库结构稳定
- 便于用户浏览和查询
- 避免过度分类导致的碎片化

**实体动态**:
- 技术术语持续演进
- 新框架、新工具不断涌现
- 需要灵活适应变化

### 2. 为什么实体页要作为主题页的子文档？

**优势**:
- 侧边栏自动展示层级关系
- 主题页作为入口，实体页作为详情
- 符合"先查主题，再查实体"的查询习惯

### 3. 为什么归档页要保留完整内容？

**原因**:
- 溯源：可以追溯到原始文档
- 完整性：不丢失任何信息
- 灵活性：支持全文搜索

### 4. 为什么使用动态链接映射？

**优势**:
- 零硬编码：自动适应新增/删除
- 一致性：确保链接始终指向正确的页面
- 可维护性：无需手动更新映射表

---

## 🚀 在任意环境中复现

### 最小实现所需组件

1. **文件系统访问**: 读取/写入 Markdown 文件
2. **文档解析**: 支持 DOCX/TXT 转 Markdown
3. **LLM调用**: 用于实体提取和内容摘要
4. **向量相似度**: 用于实体去重（可选）

### 快速开始

```bash
# 1. 创建工作目录
mkdir -p llm-wiki/{raw,wiki/{topics,entities,archive,system}}

# 2. 实现核心模块（见上文）
# - document-ingestion.js
# - content-analysis.js
# - page-generator.js
# - link-manager.js
# - hierarchy-builder.js

# 3. 配置主题和已知实体
# config.js

# 4. 运行摄取
node ingest.js ./path/to/document.md
```

---

## 🆚 环境指南对照

本指南与其他环境指南的区别：

| 指南 | 目标环境 | 主要区别 |
|------|---------|---------|
| **本指南** (IMPLEMENTATION_GUIDE.md) | OpenClaw + 飞书 Wiki | 使用飞书 API (feishu_*)，云端存储，API 调用建立层级 |
| [COZE_AGENT_GUIDE.md](./COZE_AGENT_GUIDE.md) | 扣子智能体 | 使用本地文件系统 (fs.*)，本地存储，文件夹嵌套建立层级 |

**如何选择**:
- 如果你在 **OpenClaw 平台** 并使用 **飞书 Wiki** → 阅读本指南
- 如果你在 **扣子智能体** 或需要 **纯本地部署** → 阅读 COZE_AGENT_GUIDE.md

---

## 📖 扩展阅读

- [README.md](./README.md) - 项目概述与快速开始
- [SKILL.md](./SKILL.md) - 完整功能说明和 API 文档
- [COZE_AGENT_GUIDE.md](./COZE_AGENT_GUIDE.md) - 扣子智能体环境适配指南
- [README.md](./README.md) - 项目概述

---

**适用版本**: llm-wiki-ingest v2.0+

**最后更新**: 2026-04-27
