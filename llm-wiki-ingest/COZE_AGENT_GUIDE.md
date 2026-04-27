# LLM Wiki Ingest - 扣子智能体环境兼容指南

> 本指南专门针对扣子(Coze)智能体环境，描述如何适配和部署 LLM Wiki Ingest Skill

---

## 📋 扣子环境特性

### 与飞书环境的核心差异

| 特性 | 飞书环境 | 扣子智能体环境 |
|------|---------|---------------|
| **存储位置** | 飞书 Wiki 空间 | Workspace 本地文件夹 |
| **访问方式** | Web/APP + API | 文件系统直接访问 |
| **待处理/已归档** | 飞书云空间文件夹 | `input/` / `asset/` 本地文件夹 |
| **API调用** | `feishu_create_doc` | `fs.writeFile` |
| **层级构建** | `feishu_wiki_space_node move` | 文件夹嵌套 + 路径链接 |
| **链接格式** | `https://www.feishu.cn/wiki/{token}` | `./folder/file.md` |
| **协作共享** | 团队成员可访问 | 限于智能体范围 |
| **部署复杂度** | 需要授权和配置 | 开箱即用 |
| **网络依赖** | 需要飞书 API 可用 | 纯本地，无需网络 |

### 扣子环境优势

- ✅ **零配置**: 无需申请飞书权限
- ✅ **离线运行**: 不依赖外部服务
- ✅ **快速响应**: 本地文件操作，无网络延迟
- ✅ **私密安全**: 数据不离开智能体环境
- ✅ **版本控制**: 可直接使用 Git 管理

---

## 🏗️ 扣子环境架构适配

### 目录结构

```
{workspace}/
├── input/              # 待处理文档（用户放入）
├── asset/              # 已归档文档（自动移动）
└── wiki/               # 知识库根目录
    ├── 00-首页.md
    ├── topics/         # 主题聚合页
    │   ├── Agent 架构体系.md
    │   ├── 可观测性与追踪.md
    │   └── 前后端协作规范.md
    ├── entities/       # 实体百科页
    │   ├── DeepAgents.md
    │   ├── LangChain.md
    │   └── ...
    ├── archive/        # 归档文档页
    │   ├── 动态星形多Agent架构...md
    │   └── ...
    └── system/         # 系统页面
        ├── index.md    # 系统索引
        └── log.md      # 操作日志
```

### 路径映射对比

| 概念 | 飞书路径 | 扣子路径 |
|------|---------|---------|
| 首页 | `https://www.feishu.cn/wiki/xxx` | `./00-首页.md` |
| 主题页 | `https://www.feishu.cn/wiki/xxx` | `./topics/Agent 架构体系.md` |
| 实体页 | `https://www.feishu.cn/wiki/xxx` | `./entities/DeepAgents.md` |
| 归档页 | `https://www.feishu.cn/wiki/xxx` | `./archive/文档标题.md` |
| 系统索引 | `https://www.feishu.cn/wiki/xxx` | `./system/index.md` |

---

## 🔧 核心模块适配

### 1. 文档摄取模块适配

**飞书版本**:
```javascript
// 从飞书云空间读取
const docs = await feishu_drive_file({
  action: 'list',
  folder_token: 'S7JbfzAKHlCxpbdazqicUdmjnGe'
});
```

**扣子版本**:
```javascript
const fs = require('fs').promises;
const path = require('path');

// 从本地 input/ 文件夹读取
async function listPendingDocuments(inputPath) {
  const files = await fs.readdir(inputPath);
  return files
    .filter(f => f.endsWith('.md') || f.endsWith('.docx') || f.endsWith('.txt'))
    .map(f => ({
      name: f,
      path: path.join(inputPath, f),
      format: path.extname(f).slice(1)
    }));
}

// 读取文档内容
async function readDocument(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return {
    title: path.basename(filePath, path.extname(filePath)),
    content,
    format: path.extname(filePath).slice(1),
    source: filePath
  };
}
```

### 2. 页面创建模块适配

**飞书版本**:
```javascript
// 创建飞书文档
const result = await feishu_create_doc({
  title: 'DeepAgents',
  markdown: content,
  wiki_space: '7633348949482589405'
});
// 返回 node_token
```

**扣子版本**:
```javascript
const fs = require('fs').promises;
const path = require('path');

// 创建本地 Markdown 文件
async function createLocalPage(title, content, folder) {
  const fileName = `${title}.md`;
  const filePath = path.join(WIKI_PATH, folder, fileName);
  
  // 确保文件夹存在
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  // 写入文件
  await fs.writeFile(filePath, content, 'utf-8');
  
  return {
    name: title,
    path: filePath,
    relativePath: `./${folder}/${encodeURIComponent(fileName)}`
  };
}
```

### 3. 链接生成模块适配

**飞书版本**:
```javascript
function generateFeishuLink(name, nodeToken) {
  return `[${name}](https://www.feishu.cn/wiki/${nodeToken})`;
}
```

**扣子版本**:
```javascript
function generateLocalLink(name, folder) {
  // URL编码处理空格和特殊字符
  const encodedName = encodeURIComponent(name);
  return `[${name}](./${folder}/${encodedName}.md)`;
}

// 批量生成实体链接
function generateEntityLinks(entityNames) {
  return entityNames.map(name => 
    `- [${name}](./entities/${encodeURIComponent(name)}.md)`
  ).join('\n');
}

// 生成主题链接
function generateTopicLink(topicName) {
  return `[${topicName}](./topics/${encodeURIComponent(topicName)}.md)`;
}
```

### 4. 层级构建模块适配

**飞书版本**:
```javascript
// 使用飞书 API 建立父子关系
await feishu_wiki_space_node({
  action: 'move',
  node_token: entityNodeToken,
  target_parent_token: topicNodeToken
});
```

**扣子版本**:
```javascript
// 扣子环境使用文件夹嵌套 + 路径链接
// 无需显式建立层级，通过文件路径体现

// 文件路径即层级：
// wiki/topics/Agent 架构体系.md  （主题）
// wiki/entities/DeepAgents.md    （实体，逻辑上属于某主题）

// 链接建立关联：
// 在主题页中链接到实体：
// [DeepAgents](./entities/DeepAgents.md)
```

### 5. 文件归档模块适配

**飞书版本**:
```javascript
// 移动飞书云空间文件
await feishu_drive_file({
  action: 'move',
  file_token: docToken,
  folder_token: archiveFolderToken
});
```

**扣子版本**:
```javascript
const fs = require('fs').promises;
const path = require('path');

// 本地文件移动
async function archiveDocument(sourcePath, assetPath) {
  const fileName = path.basename(sourcePath);
  const targetPath = path.join(assetPath, fileName);
  
  // 确保目标文件夹存在
  await fs.mkdir(assetPath, { recursive: true });
  
  // 移动文件
  await fs.rename(sourcePath, targetPath);
  
  return targetPath;
}
```

---

## 📦 扣子环境完整实现

### 配置文件

```javascript
// config.coze.js
module.exports = {
  // 环境标识
  environment: 'coze',
  
  // 路径配置
  paths: {
    root: '/workspace/projects/workspace/llm-wiki',
    input: '/workspace/projects/workspace/llm-wiki/input',
    asset: '/workspace/projects/workspace/llm-wiki/asset',
    wiki: '/workspace/projects/workspace/llm-wiki/wiki'
  },
  
  // 文件夹结构
  folders: {
    topics: 'topics',
    entities: 'entities',
    archive: 'archive',
    system: 'system'
  },
  
  // 链接格式
  linkFormat: 'local',  // 'local' | 'relative'
  
  // 主题配置（与飞书环境相同）
  topics: {
    fixed: [
      'Agent 架构体系',
      '可观测性与追踪',
      '前后端协作规范'
    ],
    allowNew: false
  },
  
  // 实体配置（与飞书环境相同）
  entities: {
    autoDiscover: true,
    maxNewPerDoc: 3,
    requireApproval: true
  }
};
```

### 扣子环境主程序

```javascript
// ingest.coze.js - 扣子环境主程序

const fs = require('fs').promises;
const path = require('path');
const config = require('./config.coze.js');

// 导入核心模块（适配后的版本）
const { extractEntities } = require('./entity-extractor.coze.js');
const { buildLinkMap, generateLocalLink } = require('./link-builder.coze.js');

/**
 * 初始化工作目录
 */
async function initializeWorkspace() {
  const dirs = [
    config.paths.input,
    config.paths.asset,
    path.join(config.paths.wiki, config.folders.topics),
    path.join(config.paths.wiki, config.folders.entities),
    path.join(config.paths.wiki, config.folders.archive),
    path.join(config.paths.wiki, config.folders.system)
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
  
  // 创建初始系统文件
  await createInitialFiles();
}

/**
 * 创建初始系统文件
 */
async function createInitialFiles() {
  // 创建首页
  const homePath = path.join(config.paths.wiki, '00-首页.md');
  try {
    await fs.access(homePath);
  } catch {
    const homeContent = `# LLM Wiki 首页

**最后更新**: ${new Date().toISOString().split('T')[0]}

---

## 📚 主题导航

- [Agent 架构体系](./topics/Agent%20架构体系.md)
- [可观测性与追踪](./topics/可观测性与追踪.md)
- [前后端协作规范](./topics/前后端协作规范.md)

---

## 🔧 系统

- [系统索引](./system/index.md)
- [操作日志](./system/log.md)
`;
    await fs.writeFile(homePath, homeContent, 'utf-8');
  }
  
  // 创建系统索引
  const indexPath = path.join(config.paths.wiki, config.folders.system, 'index.md');
  try {
    await fs.access(indexPath);
  } catch {
    const indexContent = `# 系统索引

**生成时间**: ${new Date().toISOString()}

---

## 📊 统计

- 主题页面: 3
- 实体页面: 0
- 归档页面: 0

---

## 📚 主题清单

| 主题 | 文档数 | 实体数 |
|------|--------|--------|
| [Agent 架构体系](./topics/Agent%20架构体系.md) | 0 | 0 |
| [可观测性与追踪](./topics/可观测性与追踪.md) | 0 | 0 |
| [前后端协作规范](./topics/前后端协作规范.md) | 0 | 0 |
`;
    await fs.writeFile(indexPath, indexContent, 'utf-8');
  }
  
  // 创建日志
  const logPath = path.join(config.paths.wiki, config.folders.system, 'log.md');
  try {
    await fs.access(logPath);
  } catch {
    const logContent = `# LLM Wiki - Log

## [${new Date().toISOString().split('T')[0]}] init | 系统初始化

- 创建目录结构
- 初始化系统文件
`;
    await fs.writeFile(logPath, logContent, 'utf-8');
  }
}

/**
 * 摄取主函数
 */
async function ingest() {
  console.log('🔧 扣子环境 LLM Wiki Ingest\n');
  
  // 1. 初始化
  await initializeWorkspace();
  
  // 2. 读取待处理文档
  const pendingFiles = await fs.readdir(config.paths.input);
  const docs = pendingFiles.filter(f => 
    f.endsWith('.md') || f.endsWith('.docx') || f.endsWith('.txt')
  );
  
  if (docs.length === 0) {
    console.log('ℹ️  input/ 文件夹为空，没有待处理的文档');
    return;
  }
  
  console.log(`📄 发现 ${docs.length} 个待处理文档\n`);
  
  // 3. 处理每个文档
  for (const docFile of docs) {
    console.log(`📝 处理: ${docFile}`);
    
    const docPath = path.join(config.paths.input, docFile);
    const content = await fs.readFile(docPath, 'utf-8');
    const title = path.basename(docFile, path.extname(docFile));
    
    // 3.1 主题分类
    const topic = classifyTopic(content);
    console.log(`   主题: ${topic}`);
    
    // 3.2 实体提取
    const linkMap = await buildLinkMap(config.paths.wiki);
    const existingEntities = Object.keys(linkMap).filter(k => 
      linkMap[k].type === 'entity'
    );
    const entities = await extractEntities(content, { 
      existingEntities,
      useLLM: true 
    });
    console.log(`   实体: ${entities.map(e => e.name).join(', ') || '无'}`);
    
    // 3.3 生成页面
    await generatePages(title, content, topic, entities, linkMap);
    
    // 3.4 归档源文档
    await fs.rename(docPath, path.join(config.paths.asset, docFile));
    console.log(`   ✅ 完成，已归档到 asset/\n`);
  }
  
  // 4. 更新系统索引
  await updateSystemIndex();
  
  console.log('🎉 全部处理完成！');
}

/**
 * 主题分类（简化版）
 */
function classifyTopic(content) {
  const lower = content.toLowerCase();
  
  const scores = {
    'Agent 架构体系': 0,
    '可观测性与追踪': 0,
    '前后端协作规范': 0
  };
  
  // 关键词匹配
  const keywords = {
    'Agent 架构体系': ['agent', '架构', '调度', 'main', 'sub'],
    '可观测性与追踪': ['langsmith', '追踪', '监控', 'trace', 'observ'],
    '前后端协作规范': ['stream', '前后端', '事件流', 'frontend', 'backend']
  };
  
  for (const [topic, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (lower.includes(word)) scores[topic]++;
    }
  }
  
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : '未分类';
}

/**
 * 生成页面
 */
async function generatePages(title, content, topic, entities, linkMap) {
  // 生成实体页面
  for (const entity of entities) {
    const entityPath = path.join(
      config.paths.wiki, 
      config.folders.entities, 
      `${entity.name}.md`
    );
    
    const entityContent = `# ${entity.name}

**实体类型**: ${entity.type || '概念'}
**创建时间**: ${new Date().toISOString().split('T')[0]}

## 📝 描述

${entity.definition || '待补充'}

## 📚 信息来源

- [${title}](../archive/${encodeURIComponent(title)}.md) - 提及该实体的文档

## 🔗 相关实体

（待补充）
`;
    
    await fs.writeFile(entityPath, entityContent, 'utf-8');
  }
  
  // 生成归档页面
  const archivePath = path.join(
    config.paths.wiki,
    config.folders.archive,
    `${title}.md`
  );
  
  const entityLinks = entities.map(e => 
    `- [${e.name}](../entities/${encodeURIComponent(e.name)}.md)`
  ).join('\n');
  
  const archiveContent = `# ${title}

**摄取时间**: ${new Date().toISOString()}
**文档类型**: markdown
**所属主题**: [${topic}](../topics/${encodeURIComponent(topic)}.md)

## 📋 核心摘要

（待生成）

## 🔗 生成的实体

${entityLinks || '无'}

## 📄 完整内容

${content}
`;
  
  await fs.writeFile(archivePath, archiveContent, 'utf-8');
  
  // 更新主题页面（追加）
  const topicPath = path.join(
    config.paths.wiki,
    config.folders.topics,
    `${topic}.md`
  );
  
  let topicContent;
  try {
    topicContent = await fs.readFile(topicPath, 'utf-8');
  } catch {
    topicContent = `# ${topic}\n\n**最后更新**: ${new Date().toISOString().split('T')[0]}\n\n---\n\n## 📝 核心概念摘要\n\n（待补充）\n\n---\n\n## 🔗 关键实体\n\n| 实体 | 类型 | 一句话定义 |\n|------|------|-----------|\n\n---\n\n## 📦 来源文档\n\n`;
  }
  
  // 追加来源文档
  const newEntry = `- [${title}](../archive/${encodeURIComponent(title)}.md) - 新添加\n`;
  topicContent = topicContent.replace(
    /## 📦 来源文档\n\n/,
    `## 📦 来源文档\n\n${newEntry}`
  );
  
  await fs.writeFile(topicPath, topicContent, 'utf-8');
}

/**
 * 更新系统索引
 */
async function updateSystemIndex() {
  // 统计各文件夹文件数
  const entities = await fs.readdir(
    path.join(config.paths.wiki, config.folders.entities)
  ).catch(() => []);
  
  const archives = await fs.readdir(
    path.join(config.paths.wiki, config.folders.archive)
  ).catch(() => []);
  
  console.log(`\n📊 当前统计:`);
  console.log(`   实体: ${entities.length}`);
  console.log(`   归档: ${archives.length}`);
}

// 运行
ingest().catch(console.error);
```

---

## 🚀 扣子环境部署步骤

### 步骤 1: 创建工作目录

```bash
mkdir -p /workspace/projects/workspace/my-llm-wiki
cd /workspace/projects/workspace/my-llm-wiki
```

### 步骤 2: 复制核心文件

```bash
# 从 skill-rep 复制适配后的文件
cp /workspace/projects/skill-rep/llm-wiki-ingest/references/entity-extractor.js ./entity-extractor.coze.js
cp /workspace/projects/skill-rep/llm-wiki-ingest/references/link-builder.js ./link-builder.coze.js

# 创建配置文件
cp /workspace/projects/skill-rep/llm-wiki-ingest/COZE_AGENT_GUIDE.md ./README.md
```

### 步骤 3: 初始化目录

```bash
node ingest.coze.js
# 会自动创建 input/, asset/, wiki/ 目录结构
```

### 步骤 4: 放入待处理文档

```bash
# 将文档放入 input/ 文件夹
cp /path/to/your/document.md ./input/
```

### 步骤 5: 运行摄取

```bash
node ingest.coze.js
```

---

## 💡 扣子环境最佳实践

### 1. 与 Git 集成

```bash
# 初始化 git 仓库
git init

# 添加 .gitignore
echo "asset/" > .gitignore  # 已归档文档不纳入版本控制

# 提交知识库内容
git add wiki/ config.coze.js
git commit -m "Initial wiki structure"
```

### 2. 定期同步到飞书（可选）

```bash
# 如果需要在飞书查看，可以定期同步
node sync-to-feishu.js --local-path ./wiki --feishu-space 7633348949482589405
```

### 3. 备份策略

```bash
# 压缩备份
tar -czf wiki-backup-$(date +%Y%m%d).tar.gz wiki/ asset/

# 或者使用 rsync
rsync -avz wiki/ backup-server:/backups/llm-wiki/
```

---

## 📖 相关文档

- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - 通用实现指南
- [README.md](./README.md) - 项目概述
- [SKILL.md](./SKILL.md) - 完整功能说明

---

**适用版本**: llm-wiki-ingest v2.0+

**最后更新**: 2026-04-27
