# LLM Wiki Ingest - 功能更新

## 更新时间
2026-04-27 21:40

---

## 新增功能

### 1. 飞书归档文档同步

**功能说明**：
- 摄取文档后，自动将归档文档同步到飞书 Wiki 空间
- 归档文档作为主题页的子文档挂载
- 提供原始文档的完整内容供查阅

**实现方式**：
```javascript
// 1. 创建归档文档
feishu_create_doc({
  wiki_space: '7633348949482589405',
  title: '{Document Title}',
  markdown: '<archive_content>'
});

// 2. 移动到对应主题下
feishu_wiki_space_node({
  action: 'move',
  node_token: '{archive_doc_node_token}',
  target_parent_token: '{topic_node_token}',
  target_space_id: '7633348949482589405'
});
```

**好处**：
- ✅ 主题页可以直接引用归档文档
- ✅ LLM 查询时可以访问原始文档完整内容
- ✅ 符合飞书 Wiki 的父子层级结构

---

### 2. 源文件自动归档

**功能说明**：
- 摄取完成后，自动将源文档从 `LLM-wiki/待处理/` 移动到 `LLM-wiki/已归档/`
- 避免重复处理同一文档
- 保持待处理文件夹整洁

**实现方式**：
```javascript
feishu_drive_file({
  action: 'move',
  file_token: '{source_file_token}',
  folder_token: 'FzubfNFlIlgFSDdVdE4coKCbnYg',  // 已归档文件夹
  type: 'doc'  // 或 'file', 取决于文档类型
});
```

**好处**：
- ✅ 自动清理待处理文件夹
- ✅ 已归档文档可以追溯
- ✅ 避免重复摄取

---

## 模板更新

### 移除前缀

**更新前**：
```markdown
[[主题聚合/{Topic}]]
[[归档文档/{Document}]]
```

**更新后**：
```markdown
[[{Topic}]]
[[{Document}]]
```

**原因**：
- 飞书 Wiki 不支持文件夹层级
- 页面名称更简洁
- 链接更直观

---

## 飞书 API 功能文档

新增以下 API 功能说明：

| API 功能 | 用途 | 关键参数 |
|----------|------|----------|
| `feishu_create_doc` | 创建飞书文档/Wiki 页面 | `wiki_space`, `title`, `markdown` |
| `feishu_update_doc` | 更新文档内容 | `doc_id`, `mode`, `markdown` |
| `feishu_wiki_space_node` | 管理 Wiki 节点（创建、移动、复制） | `action`, `node_token`, `target_parent_token` |
| `feishu_drive_file` | 管理云空间文件（移动、删除） | `action`, `file_token`, `folder_token`, `type` |
| `feishu_fetch_doc` | 获取文档内容 | `doc_id` |

---

## 处理流程更新

### 原流程
```
Step 1: 列出待处理文档
Step 2: 下载文档
Step 3: 主题分析
Step 4: 更新主题页
Step 5: 更新实体页
Step 6: 创建归档页
Step 7: 更新系统索引
Step 8: 记录日志
Step 9: 归档源文件（仅本地）
Step 10: 同步到飞书
```

### 新流程
```
Step 1: 列出待处理文档
Step 2: 下载文档
Step 3: 主题分析
Step 4: 更新主题页
Step 5: 更新实体页
Step 6: 创建归档页 + 同步到飞书 Wiki + 建立父子关系
Step 7: 更新系统索引
Step 8: 记录日志
Step 9: 归档源文件（飞书 API 移动到已归档文件夹）
Step 10: 同步到飞书 Wiki + 建立完整层级结构
```

---

## 示例：完整摄取流程

假设有一个新文档 `DeepAgents 新功能设计.docx` 在 `待处理/` 文件夹：

1. **摄取文档**：
   - 下载到本地 `raw/` 目录
   - 分析主题：归类为"Agent 架构体系"

2. **更新主题页**：
   - 更新 `topics/Agent 架构体系.md`
   - 添加文档引用

3. **更新实体页**：
   - 提取实体：`DeepAgents`, `Main Agent`
   - 更新对应的实体页面

4. **创建归档页**：
   - 创建 `wiki/archive/DeepAgents 新功能设计.md`
   - 同步到飞书 Wiki
   - 移动到"Agent 架构体系"主题下

5. **归档源文件**：
   - 调用 `feishu_drive_file` 移动源文件到 `已归档/` 文件夹

6. **同步到飞书**：
   - 创建/更新所有相关页面
   - 建立父子层级关系

---

## 注意事项

1. **文件 token 获取**：
   - 创建文档后，需要从返回结果中获取 `node_token` 或 `obj_token`
   - 用于后续的 move 操作

2. **错误处理**：
   - 如果飞书 API 调用失败，需要记录日志并回滚
   - 源文件移动失败时，不要标记文档为已处理

3. **幂等性**：
   - 重复摄取同一文档时，应该更新而非重复创建
   - 使用文档标题或 file_token 作为唯一标识

4. **性能优化**：
   - 批量创建页面时，可以分批处理
   - move 操作可以并行执行（不同主题下）

---

## 测试建议

1. **单元测试**：
   - 测试飞书 API 调用（mock 响应）
   - 测试本地文件操作
   - 测试主题分类逻辑

2. **集成测试**：
   - 使用测试飞书空间
   - 完整的摄取流程测试
   - 验证父子层级关系

3. **回归测试**：
   - 确保旧版本文档仍能正确处理
   - 验证链接格式变化不影响查询

---

## 后续优化

1. **批量操作**：
   - 支持批量摄取多个文档
   - 批量创建和移动页面

2. **增量同步**：
   - 只同步变更的内容
   - 减少飞书 API 调用次数

3. **可视化监控**：
   - 显示摄取进度
   - 统计成功/失败数量

4. **回滚机制**：
   - 支持撤销摄取操作
   - 恢复原始文档位置
