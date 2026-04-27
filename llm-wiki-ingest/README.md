# LLM Wiki Ingest

> 自动化知识库摄取系统 - 将非结构化文档转化为结构化主题-实体-归档三层知识库

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](./UPDATE_LOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

**快速导航**：[核心逻辑](#-核心逻辑) | [安装方式](#-安装方式) | [使用指南](#-快速开始) | [文档索引](#-文档索引)

---

## 📋 什么是 LLM Wiki Ingest？

LLM Wiki Ingest 是一个**智能文档摄取系统**，专为 LLM/AI Agent 设计，能够自动处理各种格式的文档，提取关键知识，并构建结构化的**主题-实体-归档**三层知识库。

### 核心问题它解决

| 问题 | 解决方案 |
|------|---------|
| **文档碎片化** | 统一归档到知识库，保留完整溯源链路 |
| **知识难以检索** | 主题聚合，一次查询获取完整上下文 |
| **实体概念混乱** | 原子化定义，建立清晰关联 |
| **格式不兼容** | 统一 Markdown 格式，支持飞书/扣子双环境 |

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
2. 主题分类 → LLM实时分析，动态归入现有主题或创建新主题
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

#### 1. 动态主题 + 高门槛策略

**为什么主题也要动态？**
- 传统固定主题限制知识库自然演进
- 新领域文档被迫归入不合适的主题
- 长期导致主题内内容过于庞杂

**动态主题优势**：
- ✅ **自组织**：主题随文档自然涌现，无需预定义
- ✅ **自适应**：相似主题自动合并，避免冗余
- ✅ **防泛滥**：高门槛(相似度<0.4)+数量限制(最多10个)保障质量
- ✅ **零人工**：LLM实时决策，无需人工干预

#### 2. 实体提取防概念爆炸

**三层过滤策略**：
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
└── 数量限制
```

#### 3. 动态链接映射

**问题**：硬编码实体列表难以维护，新增实体需手动更新映射

**解决**：运行时动态扫描文件系统
```javascript
// 自动扫描构建映射，零维护成本
const linkMap = await buildLinkMap('./wiki');
// { 'DeepAgents': './entities/DeepAgents.md', ... }
```

---

## 🚀 安装方式

### 方式一：飞书 Wiki 环境（团队协作）

**适用场景**：团队共享知识库，多人协作编辑

#### 前置要求
- 飞书企业账号
- Wiki 空间管理员权限
- 云空间文件夹访问权限

---

#### 📋 完整初始化流程

##### 第 1 步：申请 OpenClaw 飞书权限

在 OpenClaw 平台使用飞书功能，需要完成以下配置：

**1.1 飞书开放平台配置**
- 登录 [飞书开放平台](https://open.feishu.cn/)
- 创建企业自建应用
- 开启以下权限：
  - `drive:drive:readonly` - 读取云空间文件
  - `drive:file:readonly` - 读取文件内容
  - `drive:file:write` - 写入文件
  - `wiki:wiki:readonly` - 读取 Wiki
  - `wiki:wiki:write` - 写入 Wiki
  - `docx:document:readonly` - 读取文档
  - `docx:document:write` - 写入文档

**1.2 OpenClaw 配置文件**
```yaml
# 在 OpenClaw 配置文件中添加：
plugins:
  entries:
    feishu:
      config:
        appId: "cli_xxxxxxxxxxxxxxxx"      # 飞书应用 ID
        appSecret: "xxxxxxxxxxxxxxxx"      # 飞书应用密钥
```

**1.3 环境变量（可选）**
```bash
export FEISHU_APP_ID=cli_xxxxxxxxxxxxxxxx
export FEISHU_APP_SECRET=xxxxxxxxxxxxxxxx
```

**1.4 权限验证**
```bash
# 测试连接
openclaw tool feishu_drive_file --action list --folder_token xxx
```

---

##### 第 2 步：创建飞书 Wiki 知识空间

**2.1 创建 Wiki 空间**
```
1. 打开飞书 → 左侧栏点击「Wiki」
2. 点击右上角「+ 创建空间」
3. 填写信息：
   - 空间名称：LLM-wiki
   - 空间描述：LLM 知识库
   - 可见范围：按需设置（建议团队可见）
4. 点击「创建」
5. 记录空间 ID：从 URL 中获取
   例如：https://www.feishu.cn/wiki/space/7633348949482589405
   space_id = 7633348949482589405
```

**2.2 创建云空间文件夹结构**
```
1. 打开飞书 → 左侧栏点击「云空间」
2. 进入「我的空间」或团队空间
3. 创建文件夹：

   LLM-wiki/
   ├── 📁 待处理/     # 放置待摄取的原始文档
   └── 📁 已归档/     # 系统自动归档已处理文档

4. 记录 folder tokens：
   - 在浏览器中打开文件夹
   - 从 URL 中提取 folder_token
   - 或通过 OpenClaw 工具获取
```

**2.3 创建初始知识库页面**

在 Wiki 空间中手动创建以下页面：

```
LLM-wiki (空间)
├── 🏠 首页                     # 知识库导航入口
├── 📦 归档文档索引            # 归档目录页
├── ⚙️ 系统索引               # 全局索引
└── 📋 log                    # 操作日志

（注：主题页如"Agent 架构体系"等由系统自动创建）
```

**首页内容模板**：
```markdown
# LLM Wiki 首页

**最后更新**: 2026-04-27

---

## 📚 主题导航

（主题列表将由系统自动生成）

---

## 🔧 系统

- [系统索引](链接)
- [操作日志](链接)
- [归档文档索引](链接)
```

---

##### 第 3 步：保存配置信息

创建 `config.feishu.js` 文件：

```javascript
module.exports = {
  // Wiki 空间配置
  wiki: {
    spaceId: '7633348949482589405',    // 替换为你的 space_id
    spaceName: 'LLM-wiki'
  },
  
  // 云空间文件夹配置
  folders: {
    pending: {
      name: '待处理',
      token: 'YOUR_PENDING_FOLDER_TOKEN'     // 替换为你的 token
    },
    archived: {
      name: '已归档',
      token: 'YOUR_ARCHIVED_FOLDER_TOKEN'    // 替换为你的 token
    }
  },
  
  // 初始页面 node_tokens（创建后填写）
  pages: {
    home: 'YOUR_HOME_PAGE_TOKEN',
    archiveIndex: 'YOUR_ARCHIVE_INDEX_TOKEN',
    systemIndex: 'YOUR_SYSTEM_INDEX_TOKEN',
    log: 'YOUR_LOG_PAGE_TOKEN'
  }
};
```

---

##### 第 4 步：验证初始化

```bash
# 1. 测试云空间访问
openclaw tool feishu_drive_file list \
  --folder_token YOUR_PENDING_FOLDER_TOKEN

# 2. 测试 Wiki 访问
openclaw tool feishu_wiki_space_node list \
  --space_id YOUR_SPACE_ID

# 3. 创建测试文档
openclaw tool feishu_create_doc \
  --title "测试文档" \
  --markdown "# 测试\n初始化成功" \
  --wiki_space YOUR_SPACE_ID
```

---

#### 使用方式

完成上述初始化后，使用方式非常简单：

```
1. 将文档放入飞书云空间的「待处理」文件夹

2. 在 OpenClaw 中发送消息：
   "摄取文档" 或 "整理知识库"

3. 系统自动执行：
   ✓ 读取待处理文档
   ✓ 分析并分类到主题（动态创建或归入现有主题）
   ✓ 提取实体
   ✓ 创建/更新 Wiki 页面
   ✓ 建立层级关系
   ✓ 归档源文档到「已归档」文件夹

4. 查看结果：
   飞书 Wiki → LLM-wiki 空间 → 查看生成的页面
```

---

### 方式二：扣子智能体环境（个人/Agent）

**适用场景**：个人知识管理、Agent 内部知识库、离线环境

#### 快速安装（5步）

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
- 主题页面：0
- 实体页面：0
- 归档页面：0
EOF

# wiki/00-首页.md
cat > wiki/00-首页.md << 'EOF'
# LLM Wiki 首页

## 📚 主题导航
（主题列表将由系统自动生成）

## 🔧 系统
- [系统索引](./system/index.md)
- [操作日志](./system/log.md)
EOF

# 4. 安装核心组件
git clone https://github.com/LericHub/skill-rep.git
cp skill-rep/llm-wiki-ingest/references/*.js ./

# 5. 开始使用
cp /path/to/your/document.md input/
node ingest.js
```

#### 使用方式

```bash
# 1. 放入待处理文档
cp document.md input/

# 2. 运行摄取
node ingest.js

# 3. 查看生成的页面
ls wiki/topics/      # 主题聚合页
ls wiki/entities/    # 实体百科页
ls wiki/archive/     # 归档文档页

# 4. 源文档自动归档
ls asset/
```

---

## 🔧 核心组件

### 1. 实体提取器 (`entity-extractor.js`)

**功能**：分层实体识别，防概念爆炸

**三层架构**：
- **规则层**：零LLM开销，精准匹配已知实体
- **LLM层**：有约束提取，最多3个新实体
- **过滤层**：长度/频率/相似度检查

**使用**：
```javascript
const { extractEntities } = require('./entity-extractor.js');

const entities = await extractEntities(content, {
  existingEntities: ['DeepAgents', 'LangChain'],
  useLLM: true
});
```

### 2. 链接构建器 (`link-builder.js`)

**功能**：动态扫描文件系统，生成正确链接

**特性**：
- 运行时扫描，零硬编码
- 支持本地路径和飞书URL
- 自动修复 `[[...]]` 格式

**使用**：
```javascript
const { buildLinkMap, fixAllWikiLinks } = require('./link-builder.js');

const linkMap = await buildLinkMap('./wiki');
await fixAllWikiLinks('./wiki', { format: 'local' });
```

### 3. 主题管理器 (`topic-manager.js`)

**功能**：全自动动态主题管理，LLM自主决策

**决策逻辑**：
```
摄取文档 → LLM分析相似度 → 自动决策
├── 相似度 ≥ 0.7 → 归入现有主题
├── 相似度 < 0.4 → 创建新主题
└── 相似度 0.4-0.7 + 独特性高 → 创建新主题
```

**防泛滥机制**：
- 最多10个主题（硬限制）
- 每周自动合并相似主题（相似度>0.8）

**使用**：
```javascript
const { analyzeTopic } = require('./topic-manager.js');

const decision = await analyzeTopic(
  { title: '文档标题', content: '文档内容' },
  existingTopics,
  llmCaller
);
// 返回: { decision: 'CREATE'|'MERGE', newTopic|targetTopic, confidence }
```

---

## 🆚 环境对比

| 特性 | 飞书 Wiki | 扣子智能体 |
|------|-----------|-----------|
| **存储位置** | 飞书 Wiki 空间 | Workspace 本地文件夹 |
| **访问方式** | Web/APP + API | 文件系统直接访问 |
| **网络依赖** | 需要飞书 API | 纯本地，无需网络 |
| **协作共享** | 团队可访问 | 限于智能体范围 |
| **部署复杂度** | 需初始化配置 | 开箱即用 |
| **链接格式** | `https://www.feishu.cn/wiki/{token}` | `./folder/file.md` |
| **层级构建** | API `move` 操作 | 文件夹嵌套 |
| **适用场景** | 团队协作 | 个人/Agent/离线 |

---

## 🎯 快速开始

### 飞书环境（3步）

```
1. 在 飞书云空间/LLM-wiki/待处理/ 放入文档
2. 在 OpenClaw 发送消息："摄取文档"
3. 查看 飞书 Wiki/LLM-wiki 空间结果
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

**输入**：10篇关于 Agent 架构的技术文档

**输出**：
- 1个主题页：Agent 架构体系（聚合所有内容）
- 5个实体页：DeepAgents, Main Agent, Sub Agent, 星形架构, 事件流
- 10个归档页：每篇原文档完整保留

**收益**：问"Main Agent 职责" → 直接定位到实体页，一次查询获得定义、来源、关联

### 场景2：产品知识库

**输入**：产品需求文档、设计稿、会议纪要

**输出**：
- 主题页：前后端协作规范
- 实体页：产品概念、技术组件
- 归档页：可追溯所有原始文档

**收益**：新人入职 → 阅读主题页快速理解全貌

### 场景3：Agent 内部知识库

**输入**：工具使用说明、API 文档、最佳实践

**输出**：
- 结构化知识库供 Agent 查询
- 无需外部依赖，纯本地运行

**收益**：Agent 自主查询知识 → 减少对外部搜索的依赖

---

## 📚 文档索引

| 文档 | 说明 | 适用读者 |
|------|------|---------|
| [README.md](./README.md) | 项目概述与快速开始（本页） | 所有人 |
| [SKILL.md](./SKILL.md) | 完整功能说明与API参考 | 开发者 |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | OpenClaw+飞书环境详细实现指南 | OpenClaw/飞书开发者 |
| [COZE_AGENT_GUIDE.md](./COZE_AGENT_GUIDE.md) | 扣子智能体环境实现指南 | 扣子开发者 |
| [UPDATE_LOG.md](./UPDATE_LOG.md) | 更新日志 | 维护者 |

### 如何选择指南？

**根据环境选择**：
- **OpenClaw + 飞书 Wiki** → [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **扣子智能体** → [COZE_AGENT_GUIDE.md](./COZE_AGENT_GUIDE.md)

**根据目的选择**：
- **快速了解** → [README.md](./README.md)（本页）
- **复现/移植功能** → [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) 或 [COZE_AGENT_GUIDE.md](./COZE_AGENT_GUIDE.md)
- **查看API参考** → [SKILL.md](./SKILL.md)

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

**版本**: v2.0 | **最后更新**: 2026-04-27

**关键词**: 知识库, 文档摄取, 实体提取, 主题聚合, 动态主题, LLM, Agent, 飞书, 扣子, OpenClaw
