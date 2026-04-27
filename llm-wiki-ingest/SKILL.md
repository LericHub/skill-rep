---
name: llm-wiki-ingest
description: Automates the ingestion of documents from Feishu "待处理" folder into LLM Wiki knowledge base. Triggers when users say "整理知识库待处理文件", "摄取文档", "处理待处理文件", "知识库摄取", or similar phrases. Use when the user wants to process pending documents in Feishu LLM-wiki/待处理/ folder, ingest documents into the knowledge base, or organize/update the wiki with new content.
---

# LLM Wiki Ingest

Automatically ingest documents from Feishu "待处理" folder and generate structured Wiki pages.

## Overview

This skill automates the complete document ingestion workflow for LLM Wiki: downloading documents from Feishu, generating Wiki summaries, extracting entities and concepts, updating the index, archiving processed documents, and syncing everything back to Feishu Wiki space.

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

### Step 3: Analyze and Generate Wiki Pages

For each downloaded document:

1. Read document content
2. Generate source summary page in `wiki/sources/` following template:
   - Title, source link, ingestion time, document type
   - Core summary (2-3 paragraphs)
   - Key points
   - Entity mentions
   - Concept associations
   - Data/metrics
   - Open questions

3. Extract entities mentioned in document
4. Extract concepts mentioned in document
5. Create or update entity pages in `wiki/entities/`
6. Create or update concept pages in `wiki/concepts/`

### Step 4: Update Index

Update `wiki/index.md`:

- Increment source page count
- Add new source page to "来源页面" section
- Update timestamp

### Step 5: Record Log

Add entry to `wiki/log.md`:

```markdown
## [{YYYY-MM-DD HH:mm}] ingest | {Document Title}

- 来源: {Feishu link}
- 处理时间: {HH:mm:ss}
- 新增页面: [[Source]], [[Entity1]], [[Concept1]]
```

### Step 6: Archive Documents

Move processed documents from `待处理/` to `已归档/` folder:

- Archive folder token: `FzubfNFlIlgFSDdVdE4coKCbnYg`
- Keep original filenames

### Step 7: Sync to Feishu Wiki (Optional)

Sync updated Wiki to Feishu Wiki space:

- Wiki space ID: `7633348949482589405`
- Sync wiki/ and raw/ directories
- Or wait for hourly scheduled sync

## Configuration

**Feishu Folders**:
- Source folder: `LLM-wiki/待处理/` (token: `S7JbfzAKHlCxpbdazqicUdmjnGe`)
- Archive folder: `LLM-wiki/已归档/` (token: `FzubfNFlIlgFSDdVdE4coKCbnYg`)
- Wiki space: `LLM-wiki` (space_id: `7633348949482589405`)

**Local Paths**:
- Root: `/workspace/projects/workspace/llm-wiki`
- Raw: `/workspace/projects/workspace/llm-wiki/raw`
- Wiki: `/workspace/projects/workspace/llm-wiki/wiki`
- Scripts: `/workspace/projects/workspace/llm-wiki/scripts`

## Page Templates

### Source Page Template

Location: `wiki/sources/{title}.md`

```markdown
# {Document Title}

**来源**: {Feishu link}
**摄取时间**: {YYYY-MM-DD HH:mm}
**文档类型**: {docx/bitable/sheet}

## 📋 核心摘要

{2-3 paragraphs}

## 🔑 关键要点

- Point 1
- Point 2

## 🏷️ 实体提及

- [[Entity1]]
- [[Entity2]]

## 💭 概念关联

- [[Concept1]]
- [[Concept2]]

## 📊 数据/指标

- Metric1: {value}
- Metric2: {value}

## ❓ 开放问题

1. Question 1
2. Question 2
```

### Entity Page Template

Location: `wiki/entities/{name}.md`

```markdown
# {Entity Name}

**实体类型**: {人/公司/产品/项目}
**创建时间**: {YYYY-MM-DD}
**最后更新**: {YYYY-MM-DD}

## 📝 描述

{Detailed description}

## 📚 信息来源

- [[Source1]]
- [[Source2]]

## 🔗 相关实体

- [[RelatedEntity]] - {relationship}
```

### Concept Page Template

Location: `wiki/concepts/{name}.md`

```markdown
# {Concept Name}

**概念类型**: {理论/方法/框架/技术}
**创建时间**: {YYYY-MM-DD}
**最后更新**: {YYYY-MM-DD}

## 📖 定义

{Definition}

## 💡 核心思想

{Core idea}

## 📚 理论基础

- [[Source1]]
- [[Source2]]

## 🔬 应用场景

1. Scenario 1 - [[Source]]
2. Scenario 2 - [[Source]]
```

## Common Issues

### No Documents Found

If `待处理/` folder is empty:
- Inform user: "待处理文件夹为空，没有需要摄取的文档"
- Suggest: "请在飞书 LLM-wiki/待处理/ 文件夹中放入文档"

### Document Download Failed

If document cannot be downloaded:
- Check Feishu API access
- Verify document token is valid
- Log error to `wiki/log.md`
- Skip to next document

### LLM Analysis Timeout

If LLM analysis takes too long:
- Set reasonable timeout (e.g., 5 minutes per document)
- Document likely too complex - suggest breaking it down
- Log partial results

## Resources

### scripts/
- `ingest.js` - Main ingest script (already exists in llm-wiki project)
- `sync.js` - Sync script to Feishu Wiki

### references/
- `schema.md` - Complete Wiki configuration and conventions
- `QUICKSTART.md` - Quick start guide
- `FEISHU_WIKI_STRUCTURE.md` - Feishu Wiki space structure

## Troubleshooting

### Permission Issues

If Feishu API returns permission errors:
- Ensure user has authorized the Feishu app
- Check required permissions: `drive:drive`, `drive:file`, `wiki:wiki`
- Re-authorize if needed

### Sync Failures

If sync to Feishu Wiki fails:
- Check network connection
- Verify Wiki space ID is correct
- Check cron job logs
- Manual sync: `npm run sync` from llm-wiki directory

## Best Practices

1. **Process documents one at a time** for better quality control
2. **Review generated Wiki pages** before archiving
3. **Keep entity and concept names consistent**
4. **Use internal links** [[PageName]] for cross-references
5. **Update log.md** after each operation
6. **Commit to Git** after successful ingest

## Related Skills

- `llm-wiki-query` - Query the Wiki knowledge base
- `llm-wiki-lint` - Health check and consistency verification
- `llm-wiki-sync` - Manual sync to Feishu Wiki
