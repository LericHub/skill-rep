# LLM Wiki Ingest

Automated document ingestion system for Feishu LLM Wiki knowledge base.

## Overview

This skill automates the complete workflow of processing documents from Feishu "待处理" (pending) folder, generating structured Wiki pages, extracting entities and concepts, and syncing everything back to the Wiki space.

## Features

- 📥 Auto-download documents from Feishu
- 🤖 AI-powered Wiki page generation
- 🏷️ Entity and concept extraction
- 📊 Automatic index updates
- 📝 Operation logging
- 🔄 Archive processed documents
- 🚀 Sync to Feishu Wiki

## File Structure

```
llm-wiki-ingest/
├── SKILL.md              # Skill documentation and configuration
├── references/
│   ├── schema.md         # Complete Wiki configuration
│   ├── QUICKSTART.md     # Quick start guide
│   └── FEISHU_WIKI_STRUCTURE.md  # Feishu Wiki structure
└── scripts/
    └── ingest.js         # Main ingest script
```

## Usage

### Trigger Phrases

The skill automatically activates when you say:
- "整理知识库待处理文件"
- "摄取文档"
- "处理待处理文件"
- "知识库摄取"

### Ingest Workflow

1. **List Pending Documents** - Check Feishu `LLM-wiki/待处理/` folder
2. **Download Documents** - Download to local `raw/` directory
3. **Analyze and Generate** - Create Wiki pages using LLM
4. **Update Index** - Increment source count and update index.md
5. **Record Log** - Add entry to wiki/log.md
6. **Archive Documents** - Move to `已归档/` folder
7. **Sync to Wiki** - Update Feishu Wiki space

## Configuration

### Feishu Folders

- **Source**: `LLM-wiki/待处理/` (token: `S7JbfzAKHlCxpbdazqicUdmjnGe`)
- **Archive**: `LLM-wiki/已归档/` (token: `FzubfNFlIlgFSDdVdE4coKCbnYg`)
- **Wiki Space**: `LLM-wiki` (space_id: `7633348949482589405`)

### Local Paths

- **Root**: `/workspace/projects/workspace/llm-wiki`
- **Raw**: `/workspace/projects/workspace/llm-wiki/raw`
- **Wiki**: `/workspace/projects/workspace/llm-wiki/wiki`
- **Scripts**: `/workspace/projects/workspace/llm-wiki/scripts`

## Page Templates

### Source Page
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

### Entity Page
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

### Concept Page
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

## Quick Start

1. Ensure Feishu app has required permissions:
   - `drive:drive`
   - `drive:file`
   - `wiki:wiki`

2. Place documents in Feishu `LLM-wiki/待处理/` folder

3. Trigger the skill by saying:
   ```
   整理知识库待处理文件
   ```

4. The skill will automatically:
   - Process all pending documents
   - Generate Wiki pages
   - Update index and log
   - Archive processed documents

## Troubleshooting

### No Documents Found

```
待处理文件夹为空，没有需要摄取的文档
```

**Solution**: Place documents in `LLM-wiki/待处理/` folder first.

### Document Download Failed

**Check**:
- Feishu API access
- Document token validity
- Error logs in `wiki/log.md`

### LLM Analysis Timeout

**Solution**:
- Set reasonable timeout (5 minutes per document)
- Document may be too complex - break it down
- Check partial results in logs

### Permission Errors

**Check**:
- User authorization status
- Required permissions: `drive:drive`, `drive:file`, `wiki:wiki`
- Re-authorize if needed

### Sync Failures

**Check**:
- Network connection
- Wiki space ID: `7633348949482589405`
- Cron job logs
- Try manual sync: `npm run sync`

## Best Practices

1. ✅ Process documents one at a time for quality control
2. ✅ Review generated Wiki pages before archiving
3. ✅ Keep entity and concept names consistent
4. ✅ Use internal links `[[PageName]]` for cross-references
5. ✅ Update `wiki/log.md` after each operation
6. ✅ Commit to Git after successful ingest

## Related Skills

- `llm-wiki-query` - Query the Wiki knowledge base
- `llm-wiki-lint` - Health check and consistency verification
- `llm-wiki-sync` - Manual sync to Feishu Wiki

## Documentation

- [schema.md](references/schema.md) - Complete Wiki configuration and conventions
- [QUICKSTART.md](references/QUICKSTART.md) - Quick start guide
- [FEISHU_WIKI_STRUCTURE.md](references/FEISHU_WIKI_STRUCTURE.md) - Feishu Wiki space structure

## License

Please refer to the main repository license.
