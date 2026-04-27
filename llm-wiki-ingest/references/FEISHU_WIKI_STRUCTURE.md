# 飞书 Wiki 空间目录结构

本文档描述了飞书 Wiki 空间中的目录结构和内容。

## 📁 目录结构

```
飞书 Wiki 空间 (7633348949482589405)
├── 首页              # 飞书自动创建的首页
├── index.md           # Wiki 索引页面（从本地同步）
├── log.md             # 操作日志（从本地同步）
├── schema.md          # Wiki 配置（从本地同步）
├── wiki/              # Wiki 页面目录（从本地同步）
│   ├── entities/      # 实体页面
│   ├── concepts/      # 概念页面
│   └── sources/       # 来源总结
└── raw/               # 原始文档目录（从本地同步）
    └── {文档文件}     # 已归档的原始文档
```

## 📝 内容说明

### 根目录文件

- **首页**: 飞书 Wiki 自动创建的页面，可以自定义
- **index.md**: Wiki 索引页面，列出所有 Wiki 页面
- **log.md**: 操作日志，记录所有 Ingest、Query、Lint、Sync 操作
- **schema.md**: Wiki 配置和约定，定义页面结构和工作流程

### wiki/ 目录

包含所有 LLM 生成的 Wiki 页面：

- **entities/**: 实体页面（人、公司、产品、项目等）
- **concepts/**: 概念页面（理论、方法、框架、技术等）
- **sources/**: 来源总结页面（单个文档的总结）

### raw/ 目录

包含所有已归档的原始文档：

- 从飞书云空间 `LLM-wiki/待处理/` 摄取的文档
- 处理后自动移动到 `LLM-wiki/已归档/`
- 同步到飞书 Wiki 空间的 `raw/` 目录

## 🔄 同步规则

### 同步内容

- ✅ `wiki/` 目录下的所有 `.md` 文件
- ✅ `raw/` 目录下的所有文件
- ✅ 根目录的 `index.md`, `log.md`, `schema.md`

### 不同步内容

- ❌ `lint-report.md` (健康检查报告，临时文件)
- ❌ `node_modules/` (依赖包)
- ❌ 其他临时文件

### 同步频率

- 每小时自动同步一次（Cron 任务）
- 也可以手动运行 `npm run sync`

## 🎯 设计理念

将原始文档也同步到飞书 Wiki 空间的目的：

1. **集中管理**: 所有需要引用的内容都在一个地方
2. **方便查找**: Wiki 页面和原始文档在同一空间，便于关联
3. **版本控制**: 飞书 Wiki 有自己的版本历史
4. **团队协作**: 如果需要共享，可以直接分享 Wiki 空间

## 💡 使用建议

### 查找内容

1. **查找 Wiki 页面**: 查看 `index.md` 或直接搜索
2. **查找原始文档**: 进入 `raw/` 目录
3. **关联查看**: 在 Wiki 页面中引用原始文档链接

### 引用方式

在 Wiki 页面中引用原始文档：

```markdown
## 参考

- [[raw/文档名称]] - 链接到原始文档
```

## 🔧 配置

同步配置在 `scripts/sync.js` 中：

```javascript
const PATHS = {
  wiki: '/workspace/projects/workspace/llm-wiki/wiki',
  raw: '/workspace/projects/workspace/llm-wiki/raw',
  log: '/workspace/projects/workspace/llm-wiki/wiki/log.md'
};
```

飞书 Wiki 配置：

```javascript
const FEISHU_CONFIG = {
  wikiSpace: '7633348949482589405'
};
```
