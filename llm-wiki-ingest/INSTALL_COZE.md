# LLM Wiki Ingest - 扣子智能体安装说明

> 本文档专门针对扣子(Coze)智能体环境，说明如何在不依赖飞书 Wiki 的情况下部署和使用本 Skill。

---

## 🎯 环境差异说明

| 功能 | 飞书环境 | 扣子智能体环境 |
|------|---------|--------------|
| **文档存储** | 飞书 Wiki 空间 | Workspace 本地文件夹 |
| **层级结构** | 父子文档关系 | 文件夹/文件层级 |
| **待处理/已归档** | 飞书云空间文件夹 | `input/` 和 `asset/` 文件夹 |
| **归档操作** | `feishu_drive_file` API | 本地文件移动/复制 |
| **文档链接** | `https://www.feishu.cn/wiki/{token}` | 相对路径 `./folder/file.md` |

---

## 📁 目录结构（扣子环境）

在扣子智能体的 Workspace 中，本 Skill 使用以下目录结构：

```
{workspace}/
├── input/                          # 待处理文档目录
│   └── （放置待摄取的原始文档）
├── asset/                          # 已归档文档目录
│   └── （摄取后的原始文档归档）
├── wiki/                           # 知识库目录
│   ├── 00-首页.md
│   ├── topics/                     # 主题聚合页
│   │   ├── Agent 架构体系.md
│   │   ├── 可观测性与追踪.md
│   │   └── 前后端协作规范.md
│   ├── entities/                   # 实体百科页
│   │   ├── DeepAgents.md
│   │   ├── LangChain.md
│   │   ├── LangSmith.md
│   │   ├── Main Agent.md
│   │   ├── Sub Agent.md
│   │   ├── 事件流.md
│   │   ├── 全链路追踪.md
│   │   └── 星形架构.md
│   ├── archive/                    # 归档文档
│   │   ├── DeepAgents Stream状态流及前后端对接.md
│   │   ├── MeowBot 接入 LangSmith.md
│   │   └── 动态星形多Agent架构（类Claude Agent Teams）部署方案.md
│   └── system/                     # 系统页面
│       ├── index.md                # 系统索引
│       └── log.md                  # 操作日志
└── raw/                            # 原始文档下载缓存
```

---

## 🛠️ 安装步骤

### Step 1: 创建工作目录

在扣子智能体的 Workspace 中执行：

```bash
# 创建主目录
mkdir -p {workspace}/input
mkdir -p {workspace}/asset
mkdir -p {workspace}/wiki/topics
mkdir -p {workspace}/wiki/entities
mkdir -p {workspace}/wiki/archive
mkdir -p {workspace}/wiki/system
mkdir -p {workspace}/raw
```

### Step 2: 初始化基础文件

创建 `wiki/system/log.md`：

```markdown
# LLM Wiki - Log

> Wiki 操作日志：记录所有 Ingest、Query、Build 操作
> 格式：## [{时间}] {操作类型} | {标题}

---

## [2026-04-27] init | 系统初始化

- 创建 Wiki 目录结构
- 初始化 input/asset 文件夹
- 准备开始摄取文档
```

创建 `wiki/system/index.md`：

```markdown
# 系统索引

**生成时间**: {timestamp}

---

## 📚 主题清单
| 主题 | 文档数 | 实体数 |
|------|--------|--------|
| [Agent 架构体系](./topics/Agent%20架构体系.md) | 0 | 0 |
| [可观测性与追踪](./topics/可观测性与追踪.md) | 0 | 0 |
| [前后端协作规范](./topics/前后端协作规范.md) | 0 | 0 |

## 🏷️ 实体清单
| 实体 | 类型 | 所属主题 |
|------|------|----------|
| （待添加） | | |

## 📦 归档文档
| 文档 | 时间 | 主题 |
|------|------|------|
| （待添加） | | |
```

### Step 3: 配置路径常量

修改脚本中的路径配置（从飞书路径改为本地路径）：

```javascript
// 扣子环境路径配置
const PATHS = {
  root: '{workspace}',
  input: '{workspace}/input',      // 待处理文档（原飞书 待处理/）
  asset: '{workspace}/asset',      // 已归档文档（原飞书 已归档/）
  wiki: '{workspace}/wiki',
  topics: '{workspace}/wiki/topics',
  entities: '{workspace}/wiki/entities',
  archive: '{workspace}/wiki/archive',
  system: '{workspace}/wiki/system',
  raw: '{workspace}/raw',
  log: '{workspace}/wiki/system/log.md'
};
```

### Step 4: 修改摄取流程（关键）

将飞书 API 调用替换为本地文件操作：

#### 原飞书 API（注释掉或删除）

```javascript
// ❌ 飞书环境 - 不使用
// feishu_create_doc({...})
// feishu_wiki_space_node({action: 'move', ...})
// feishu_drive_file({action: 'move', ...})
```

#### 扣子环境 - 本地文件操作

```javascript
// ✅ 扣子环境 - 使用本地文件操作
const fs = require('fs').promises;
const path = require('path');

// Step 1: 列出待处理文档
async function listPendingDocuments() {
  const files = await fs.readdir(PATHS.input);
  return files.filter(f => !f.startsWith('.')); // 排除隐藏文件
}

// Step 2: 读取文档内容
async function readDocument(filePath) {
  const content = await fs.readFile(path.join(PATHS.input, filePath), 'utf-8');
  return content;
}

// Step 6: 创建归档页（本地）
async function createArchivePage(doc) {
  const archivePath = path.join(PATHS.archive, `${doc.name}.md`);
  const content = generateArchiveContent(doc);
  await fs.writeFile(archivePath, content, 'utf-8');
  return { localPath: archivePath };
}

// Step 9: 归档源文件（本地移动）
async function archiveSourceFile(fileName) {
  const sourcePath = path.join(PATHS.input, fileName);
  const targetPath = path.join(PATHS.asset, fileName);
  await fs.rename(sourcePath, targetPath); // 移动文件
  return { archived: true, path: targetPath };
}
```

### Step 5: 修改链接格式

将飞书 URL 链接改为本地相对路径：

#### 原飞书格式（注释掉）

```markdown
<!-- ❌ 飞书环境 -->
[DeepAgents](https://www.feishu.cn/wiki/MwwxwpM9ti5yyWkk0NJcxuwWnHh)
```

#### 扣子环境格式

```markdown
<!-- ✅ 扣子环境 -->
[DeepAgents](./entities/DeepAgents.md)
[Agent 架构体系](./topics/Agent%20架构体系.md)
```

修改模板生成代码：

```javascript
// 生成相对路径链接
function generateLocalLink(fileName, folder) {
  return `[${fileName}](./${folder}/${encodeURIComponent(fileName)}.md)`;
}

// 使用示例
generateLocalLink('DeepAgents', 'entities');
// 输出: [DeepAgents](./entities/DeepAgents.md)
```

---

## 📋 扣子环境完整摄取流程

```javascript
/**
 * 扣子环境 - 完整摄取流程
 */
async function ingestWorkflow() {
  console.log('🚀 开始摄取流程（扣子环境）\n');
  
  // Step 1: 列出待处理文档
  const pendingDocs = await listPendingDocuments();
  if (pendingDocs.length === 0) {
    console.log('⚠️  input/ 目录为空');
    return;
  }
  
  // Step 2-3: 读取并分析文档
  for (const docName of pendingDocs) {
    const content = await readDocument(docName);
    const analysis = analyzeDocument(content, docName);
    
    // Step 4-6: 更新本地页面
    await updateTopicPage(analysis.topic, docName);
    await updateEntityPages(analysis.entities, docName);
    await createArchivePage(analysis, docName);
    
    // Step 9: 归档源文件（本地移动）
    await archiveSourceFile(docName);
  }
  
  // Step 7-8: 更新索引和日志
  await updateSystemIndex();
  await recordLog(pendingDocs);
  
  console.log('\n✅ 摄取完成！');
  console.log(`📁 文档已归档到: ${PATHS.asset}`);
  console.log(`📚 知识库已更新: ${PATHS.wiki}`);
}
```

---

## 🔧 关键修改点汇总

### 1. 路径映射

| 飞书路径 | 扣子本地路径 |
|---------|-------------|
| `飞书 Wiki 空间` | `{workspace}/wiki/` |
| `LLM-wiki/待处理/` | `{workspace}/input/` |
| `LLM-wiki/已归档/` | `{workspace}/asset/` |
| `wiki/topics/` | `{workspace}/wiki/topics/` |
| `wiki/entities/` | `{workspace}/wiki/entities/` |
| `wiki/archive/` | `{workspace}/wiki/archive/` |

### 2. API 替换

| 飞书 API | 扣子本地操作 |
|---------|-------------|
| `feishu_create_doc` | `fs.writeFile` |
| `feishu_update_doc` | `fs.writeFile` |
| `feishu_wiki_space_node` | `fs.mkdir` / 文件移动 |
| `feishu_drive_file` (move) | `fs.rename` |
| `feishu_fetch_doc` | `fs.readFile` |

### 3. 链接格式

| 飞书格式 | 扣子格式 |
|---------|---------|
| `[文本](https://www.feishu.cn/wiki/{token})` | `[文本](./folder/file.md)` |

---

## ✅ 验证安装

安装完成后，验证以下功能：

```bash
# 1. 检查目录结构
ls -la {workspace}/
ls -la {workspace}/input/
ls -la {workspace}/asset/
ls -la {workspace}/wiki/

# 2. 测试摄取流程
# 在 input/ 目录放入测试文档
# 运行摄取脚本
# 验证 wiki/ 目录生成新页面
# 验证 asset/ 目录有归档文件
```

---

## 📝 注意事项

1. **编码问题**: 文件名含中文时，使用 `encodeURIComponent` 处理链接
2. **路径分隔符**: Windows 和 Linux 路径分隔符不同，使用 `path.join()`
3. **文件权限**: 确保脚本有读写 Workspace 的权限
4. **增量更新**: 每次摄取前检查文件是否已处理（通过日志或文件存在性）

---

## 🔄 与飞书环境的差异对比

| 特性 | 飞书环境 | 扣子环境 |
|------|---------|---------|
| 部署复杂度 | 需要飞书授权和 API 配置 | 无需外部依赖，纯本地操作 |
| 访问方式 | 通过飞书 Web/APP | 直接访问 Workspace 文件 |
| 协作共享 | 飞书成员可访问 | 限于智能体会话范围 |
| 链接跳转 | 飞书 Wiki 内部跳转 | 本地文件系统相对路径 |
| 归档方式 | API 移动 | 本地文件移动 |
| 适用场景 | 团队协作、知识共享 | 个人知识管理、智能体内部使用 |

---

## 📚 相关文档

- [主 SKILL.md](./SKILL.md) - 通用功能说明
- [UPDATE_LOG.md](./UPDATE_LOG.md) - 更新日志

---

**适用版本**: llm-wiki-ingest v1.0+

**最后更新**: 2026-04-27
