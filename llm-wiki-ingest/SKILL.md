---
name: llm-wiki-ingest
description: Automates the ingestion of documents from Feishu "待处理" folder into LLM Wiki knowledge base. Triggers when users say "整理知识库待处理文件", "摄取文档", "处理待处理文件", "知识库摄取", or similar phrases. Use when the user wants to process pending documents in Feishu LLM-wiki/待处理/ folder, ingest documents into the knowledge base, or organize/update the wiki with new content.
---

# LLM Wiki Ingest

Automatically ingest documents from Feishu "待处理" folder and generate structured Wiki pages with topic-based organization.

## Overview

This skill automates the complete document ingestion workflow for LLM Wiki with the new topic-based architecture:

**知识库结构**:
- 🏠 **首页** (Home) - 纯粹的导航索引，通过链接跳转到各主题
- 📚 **主题聚合页** (Topics) - 按查询场景组织，每个主题作为容器拥有自己的子文档（实体、归档）
- 🏷️ **实体百科** (Entities) - 原子化实体定义，作为主题页的子文档
- 📦 **归档文档** (Archive) - 已摄取的原始文档完整内容，作为主题页的子文档
- 🔧 **系统** (System) - 索引和日志（根目录下）

**飞书 Wiki 层级结构**:
```
LLM-wiki (空间)
├── 🏠 首页 [根节点]
├── 🎯 Agent 架构体系 [根节点]
│   ├── 🧱 DeepAgents [子文档]
│   ├── 🔗 LangChain [子文档]
│   └── ...其他实体和归档文档
├── 🔍 可观测性与追踪 [根节点]
│   └── ...子文档
├── 🤝 前后端协作规范 [根节点]
│   └── ...子文档
├── 📦 归档文档索引 [根节点]
│   └── 📄 部署方案 [子文档]
├── ⚙️ 系统索引 [根节点]
└── 📋 log [根节点]
```

**处理流程**:
1. 摄取文档 → 2. 主题分析 → 3. 更新主题页 → 4. 更新实体页 → 5. 创建归档页 → 6. 更新系统索引 → 7. 建立父子层级关系

## Ingest Workflow

### Step 1: List Pending Documents

Check Feishu `LLM-wiki/待处理/` folder for documents:

```bash
# Use Feishu API to list documents
# Folder token: S7JbfzAKHlCxpbdazqicUdmjnGe
```

If no documents found, inform user and exit.

### Step 2: Download Documents

For each document in the pending folder:

1. Download document content to local `raw/` directory
2. Save as markdown using Feishu document ID as filename
3. Document formats supported: docx, doc, bitable, sheet

### Step 3: Analyze and Classify Topic

For each downloaded document:

1. **Read document content**
2. **Analyze topic classification** using rules below
3. **Identify primary topic** (Agent架构 / 可观测性 / 前后端协作)
4. **Extract secondary topics** if applicable

**Topic Classification Rules**:

| 主题 | 关键词 | 示例 |
|------|--------|------|
| **Agent 架构体系** | 星形架构, Main Agent, Sub Agent, 多Agent, 协作, 调度, LangGraph | 动态星形多Agent架构部署方案 |
| **可观测性与追踪** | LangSmith, 追踪, 监控, 可观测性, ProjectID, TraceID, RunID, 链路 | MeowBot 接入 LangSmith |
| **前后端协作规范** | Stream, 前后端, 事件流, 状态流, SSE, WebSocket, 协作规范 | DeepAgents Stream状态流及前后端对接 |

### Step 4: Update Topic Aggregation Pages

For each identified topic, update the corresponding topic page:

**Location**: `wiki/topics/{topic-name}.md`

**Update actions**:
1. **Increment document count**
2. **Add to "📦 来源文档" section**:
   ```markdown
   - [[归档文档/{Document Title}]] - {一句话摘要}
   ```
3. **Update "🔗 关键实体" table** if new entities found
4. **Append to "📚 知识点" section**:
   - Extract 2-3 key points from document
   - Add as bullet points with brief explanation

### Step 5: Update Entity Pages

For each entity mentioned in the document:

**Location**: `wiki/entities/{entity-name}.md`

**Update actions**:
1. **Update "最后更新时间"**
2. **Add to "📦 来源" section**:
   ```markdown
   - [[归档文档/{Document Title}]] - {brief description}
   ```
3. **Add to "📚 相关主题" section**:
   ```markdown
   - [[主题聚合/{Topic Name}]]
   ```
4. If entity doesn't exist, create new entity page

### Step 6: Create Archive Document Page

Create a new page in archive section and sync to Feishu Wiki:

**Location**: `wiki/archive/{document-title}.md`

**Content**:
```markdown
# {Document Title}

**摄取时间**: {YYYY-MM-DD HH:mm}
**原始来源**: [飞书链接]({feishu_url})
**文档类型**: {docx/bitable/sheet}
**所属主题**: [[{Primary Topic}]]

## 📋 核心摘要

{2-3 paragraphs summary}

## 🔗 生成的实体
- [[{Entity1}]]
- [[{Entity2}]]

## 📚 知识点
- Point 1
- Point 2

## 📄 完整内容
{Full document content}
```

**Sync to Feishu Wiki**:
- Create the archive document in Feishu Wiki
- Link it as a child node to the corresponding topic page
- Use the parent topic's `node_token` as `target_parent_token`

**飞书 API 操作**:
```javascript
feishu_create_doc({
  wiki_space: '7633348949482589405',
  title: '{Document Title}',
  markdown: '<archive_content>'
});

// 然后移动到对应主题下
feishu_wiki_space_node({
  action: 'move',
  node_token: '{archive_doc_node_token}',
  target_parent_token: '{topic_node_token}',
  target_space_id: '7633348949482589405'
});
```

### Step 7: Update System Index

Update `wiki/system/index.md`:

**Actions**:
1. **Increment counters**:
   - Total documents
   - Documents per topic
   - Total entities
2. **Add to entity-topic mapping table**:
   ```markdown
   | {Entity} | {Topic1}, {Topic2} |
   ```
3. **Add to archive document list**:
   ```markdown
   | {Document} | {Date} | {Topic} |
   ```

### Step 8: Record Log

Add entry to `wiki/system/log.md`:

```markdown
## [{YYYY-MM-DD HH:mm}] ingest | {Document Title}

- 来源: {Feishu link}
- 处理时间: {HH:mm:ss}
- 识别主题: {Primary Topic}
- 生成/更新实体: [[{Entity1}]], [[{Entity2}]]
- 创建归档页: [[{Document Title}]] (已同步到飞书)
```

### Step 9: Archive Source Document

Move processed documents from `待处理/` to `已归档/` folder in Feishu:

- **Source folder**: `LLM-wiki/待处理/` (token: `S7JbfzAKHlCxpbdazqicUdmjnGe`)
- **Target folder**: `LLM-wiki/已归档/` (token: `FzubfNFlIlgFSDdVdE4coKCbnYg`)
- Keep original filenames

**飞书 API 操作**:
```javascript
feishu_drive_file({
  action: 'move',
  file_token: '{source_file_token}',
  folder_token: 'FzubfNFlIlgFSDdVdE4coKCbnYg',  // 已归档文件夹
  type: 'doc'  // 或 'file', 取决于文档类型
});
```

### Step 10: Sync to Feishu Wiki

Sync updated Wiki to Feishu Wiki space and build hierarchy:

- Wiki space ID: `7633348949482589405`
- Create/update pages in corresponding sections
- **建立父子层级关系**（Move 操作）

**父子层级建立逻辑**:

1. **确保主题页和首页在根目录**:
   - 首页、主题页、系统页的 `parent_node_token = ""`

2. **将实体和归档文档移动到对应主题下**:
   ```javascript
   // 主题-实体映射
   const topicEntityMapping = {
     'Agent 架构体系': [
       'DeepAgents', 'LangChain', 'Main Agent', 'Sub Agent',
       '星形架构', '事件流'
     ],
     '可观测性与追踪': [
       'LangSmith', '全链路追踪', 'MeowBot 接入 LangSmith'
     ],
     '前后端协作规范': [
       'DeepAgents Stream状态流及前后端对接'
     ],
     '归档文档索引': [
       '动态星形多Agent架构（类Claude Agent Teams）部署方案'
     ]
   };

   // 执行 move 操作
   for (const [topic, entities] of Object.entries(topicEntityMapping)) {
     const topicNodeToken = getNodeToken(topic); // 获取主题页的 node_token

     for (const entity of entities) {
       const entityNodeToken = getNodeToken(entity);
       moveNode(entityNodeToken, {
         target_parent_token: topicNodeToken,
         target_space_id: '7633348949482589405'
       });
     }
   }
   ```

3. **Move 操作 API**:
   ```javascript
   feishu_wiki_space_node({
     action: 'move',
     node_token: {entity_node_token},
     target_parent_token: {topic_node_token},
     target_space_id: '7633348949482589405'
   });
   ```

## Configuration

**Feishu Folders**:
- Source folder: `LLM-wiki/待处理/` (token: `S7JbfzAKHlCxpbdazqicUdmjnGe`)
- Archive folder: `LLM-wiki/已归档/` (token: `FzubfNFlIlgFSDdVdE4coKCbnYg`)
- Wiki space: `LLM-wiki` (space_id: `7633348949482589405`)

**Feishu Wiki Nodes**:
- 首页: `Kq2kwch3zig5ufk6ShDcMjXlni8`
- Agent 架构体系: `ImAqwcibziRRzDkuoiycFXrtntg`
- 可观测性与追踪: `E9JbwYR8IiVqEWkkB7VcHwvmnAg`
- 前后端协作规范: `TyYvwVBhkiBQUTk1O0RctYLBnRU`
- 归档文档索引: `TsJzwT7EOiPCTBkyZricS4byn7c`
- 系统索引: `Ack9wlDHYiufrhktK9fcmwTonkg`
- log: `VFxJwSTUyiDtC9kwfNxcHe2ln9c`

**Feishu API 功能**:
- `feishu_create_doc` - 创建飞书文档/Wiki 页面
- `feishu_update_doc` - 更新文档内容
- `feishu_wiki_space_node` - 管理 Wiki 节点（创建、移动、复制）
- `feishu_drive_file` - 管理云空间文件（移动、删除）
- `feishu_fetch_doc` - 获取文档内容

**Local Paths**:
- Root: `/workspace/projects/workspace/llm-wiki`
- Topics: `/workspace/projects/workspace/llm-wiki/wiki/topics`
- Entities: `/workspace/projects/workspace/llm-wiki/wiki/entities`
- Archive: `/workspace/projects/workspace/llm-wiki/wiki/archive`
- System: `/workspace/projects/workspace/llm-wiki/wiki/system`
- Raw: `/workspace/projects/workspace/llm-wiki/raw`

**Existing Topics**:
1. Agent 架构体系 - 星形架构、多Agent协作
2. 可观测性与追踪 - LangSmith、链路追踪
3. 前后端协作规范 - Stream、事件流、协作规范

## Page Templates

### Topic Aggregation Page Template

Location: `wiki/topics/{topic-name}.md`

```markdown
# {Topic Name}

**最后更新**: {YYYY-MM-DD}
**文档数**: {count}
**实体数**: {count}

---

## 📝 核心概念摘要

{200-300字主题概述，给LLM快速理解}

---

## 🔗 关键实体

| 实体 | 类型 | 一句话定义 |
|------|------|-----------|
| [[{Entity}]] | {type} | {definition} |

---

## 📚 知识点

### {Date} - {Document Title}
{Key points extracted from document}

---

## 📦 来源文档

- [[{Doc1}]] - {summary}
- [[{Doc2}]] - {summary}

---

## 🎯 快速查询

**问**: "{common question}?"  
**答**: 见本文档"{section}"部分
```

### Entity Page Template

Location: `wiki/entities/{entity-name}.md`

```markdown
# {Entity Name}

**实体类型**: {framework/tool/concept/component}
**创建时间**: {YYYY-MM-DD}
**最后更新**: {YYYY-MM-DD}

## 📝 描述

{Detailed description}

## 📚 相关主题
- [[{Topic1}]]
- [[{Topic2}]]

## 📦 来源
- [[{Doc1}]] - {description}
- [[{Doc2}]] - {description}

## 🔗 相关实体
- [[{RelatedEntity}]] - {relationship}
```

### Archive Document Page Template

Location: `wiki/archive/{document-title}.md`

```markdown
# {Document Title}

**摄取时间**: {YYYY-MM-DD HH:mm}
**原始来源**: [飞书链接]({url})
**文档类型**: {docx/bitable/sheet}
**所属主题**: [[{Topic}]]

## 📋 核心摘要

{Summary}

## 🔗 生成的实体
- [[{Entity1}]]
- [[{Entity2}]]

## 📚 知识点
{Key points}

## 📄 完整内容
{Full content}
```

**飞书同步说明**：
- 归档文档会自动同步到飞书 Wiki 空间
- 作为对应主题页的子文档挂载
- 提供原始文档的完整内容供查阅
- 飞书链接格式：`https://www.feishu.cn/wiki/{node_token}`

### System Index Page Template

Location: `wiki/system/index.md`

```markdown
# 系统索引

**生成时间**: {timestamp}

---

## 📚 主题清单
| 主题 | 文档数 | 实体数 |
|------|--------|--------|
| [[主题聚合/{Topic}]] | {n} | {n} |

## 🏷️ 实体清单
| 实体 | 类型 | 所属主题 |
|------|------|----------|
| [[{Entity}]] | {type} | {Topic1}, {Topic2} |

## 📦 归档文档
| 文档 | 时间 | 主题 |
|------|------|------|
| [[归档文档/{Doc}]] | {date} | {topic} |
```

## Topic Classification Algorithm

```javascript
function classifyTopic(document) {
  const content = document.content.toLowerCase();
  const title = document.title.toLowerCase();
  
  const topicKeywords = {
    'Agent 架构体系': [
      '星形架构', 'main agent', 'sub agent', '多agent', 'agent协作', 
      '调度', 'langgraph', '架构', '中心节点', '子节点'
    ],
    '可观测性与追踪': [
      'langsmith', '追踪', '监控', '可观测', 'observability', 
      'projectid', 'traceid', 'runid', '链路', 'tracing'
    ],
    '前后端协作规范': [
      'stream', '前后端', '事件流', '状态流', 'sse', 
      'websocket', '协作', 'frontend', 'backend', 'astream'
    ]
  };
  
  const scores = {};
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    scores[topic] = 0;
    for (const keyword of keywords) {
      if (content.includes(keyword) || title.includes(keyword)) {
        scores[topic]++;
      }
    }
  }
  
  // Return topic with highest score
  const primaryTopic = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // Return secondary topics (score > 0)
  const secondaryTopics = Object.entries(scores)
    .filter(([topic, score]) => score > 0 && topic !== primaryTopic)
    .map(([topic]) => topic);
  
  return { primary: primaryTopic, secondary: secondaryTopics };
}
```

## Common Issues

### No Documents Found

If `待处理/` folder is empty:
- Inform user: "待处理文件夹为空，没有需要摄取的文档"
- Suggest: "请在飞书 LLM-wiki/待处理/ 文件夹中放入文档"

### Topic Classification Uncertain

If document doesn't match any topic clearly:
- Flag for manual review
- Default to "未分类" topic
- Log in system log

### Topic Page Too Large

If topic page exceeds 5000 characters:
- Trigger topic split warning
- Suggest creating sub-topics
- Log in system log

## Best Practices

1. **Always classify topic first** before processing entities
2. **Update topic page incrementally** - append new content don't overwrite
3. **Link entities to topics** - ensure bidirectional references
4. **Keep archive pages complete** - full content for traceability
5. **Update system index** - maintain accurate statistics
6. **Log all operations** - for audit and debugging

## Related Skills

- `llm-wiki-query` - Query the Wiki knowledge base
- `llm-wiki-topic-manager` - Topic health check and reorganization
- `llm-wiki-sync` - Manual sync to Feishu Wiki
