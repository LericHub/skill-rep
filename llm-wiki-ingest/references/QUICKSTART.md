# LLM Wiki - 快速入门指南

## 🎉 系统已就绪！

你的 LLM Wiki 系统已经成功搭建完成！

---

## 📁 系统结构

```
/workspace/projects/workspace/llm-wiki/
├── raw/              # 原始文档（从飞书同步）
├── wiki/             # LLM 维护的 Wiki
│   ├── index.md      # 目录索引
│   ├── log.md        # 操作日志
│   ├── entities/     # 实体页面
│   ├── concepts/     # 概念页面
│   └── sources/      # 来源总结
├── scripts/          # 自动化脚本
│   ├── ingest.js     # 摄取文档 ✅
│   ├── query.js      # 查询 Wiki ✅
│   ├── lint.js       # 健康检查 ✅
│   └── sync.js       # 同步到飞书 ✅
├── schema.md         # Wiki 配置
└── README.md         # 本文件
```

---

## 🚀 如何使用

### 1️⃣ 摄取文档

在飞书中：
1. 打开 `LLM-wiki/待处理/` 文件夹
2. 放入你想处理的文档
3. 回到这里，告诉我："摄取文档"

系统会自动：
- 下载文档
- 生成 Wiki 页面
- 提取实体和概念
- 更新索引
- 归档文档

### 2️⃣ 查询 Wiki

直接问我问题，例如：
- "Wiki 中关于 AI Agent 有什么信息？"
- "LLM-wiki 的核心概念是什么？"
- "总结一下最近摄取的文档"

### 3️⃣ 健康检查

系统每周日凌晨 2 点自动运行，你也可以随时告诉我："运行健康检查"

### 4️⃣ 同步到飞书

系统每小时自动同步，你也可以随时告诉我："同步到飞书"

---

## ⏰ 定时任务

已配置以下定时任务：

| 任务 | 频率 | 状态 |
|------|------|------|
| 同步到飞书 Wiki | 每小时 | ✅ 已启用 |
| 健康检查 | 每周日凌晨 2 点 | ✅ 已启用 |

---

## 🔧 配置

### 飞书文件夹

- **待处理**: `LLM-wiki/待处理/` (token: `S7JbfzAKHlCxpbdazqicUdmjnGe`)
- **已归档**: `LLM-wiki/已归档/` (token: `FzubfNFlIlgFSDdVdE4coKCbnYg`)
- **Wiki 空间**: `LLM-wiki` (space_id: `7633348949482589405`)

### 本地路径

```
/workspace/projects/workspace/llm-wiki/
```

---

## 📝 使用示例

### 示例 1：摄取文档

```
你: 摄取文档

我: 好的，开始摄取飞书「待处理」文件夹中的文档...

    [处理过程...]

    ✅ 已处理 2 个文档
    - 文档1: 总结实体A、概念B
    - 文档2: 总结实体C、概念D

    Wiki 已更新！
```

### 示例 2：查询 Wiki

```
你: Wiki 中关于 AI Agent 有什么信息？

我: 根据你的 Wiki，AI Agent 的关键信息包括：

    1. 核心概念：AI Agent 是...
    2. 相关实体：OpenAI, Anthropic 等
    3. 应用场景：...

    来源：[[AI Agent 概念]], [[LLM 应用案例]]
```

### 示例 3：运行健康检查

```
你: 运行健康检查

我: 正在检查 Wiki 健康状态...

    📊 检查结果：
    ✅ 孤立链接: 0
    ✅ 空页面: 0
    ⚠️  需要验证: 2

    健康状态：良好
```

---

## 🎯 下一步

1. **放入第一个文档**：在飞书 `LLM-wiki/待处理/` 放入一个文档
2. **触发摄取**：告诉我"摄取文档"
3. **开始探索**：问我关于 Wiki 的问题

---

## 📚 更多信息

- **详细配置**: 查看 [schema.md](schema.md)
- **操作日志**: 查看 [wiki/log.md](wiki/log.md)
- **原始概念**: [Karpathy's llm-wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)

---

## 🆘 遇到问题？

常见问题：

1. **文档没有被摄取？**
   - 检查文档是否在正确的文件夹：`LLM-wiki/待处理/`
   - 确保文档类型支持：docx, doc, bitable, sheet

2. **查询没有结果？**
   - Wiki 可能还是空的，先摄取一些文档
   - 查看索引：[wiki/index.md](wiki/index.md)

3. **同步失败？**
   - 检查网络连接
   - 查看日志：[wiki/log.md](wiki/log.md)

---

**祝你使用愉快！有任何问题随时问我！** 🚀
