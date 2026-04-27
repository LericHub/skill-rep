/**
 * 实体提取器 - 分层识别策略
 * 
 * 设计理念：
 * 1. 规则层：零LLM开销，精准匹配已知实体
 * 2. LLM层：有约束的灵活提取，最多3个新实体
 * 3. 过滤层：长度、频率、相似度检查
 * 4. 审核层：人工确认全新实体
 */

// 已知实体列表（可扩展）
const KNOWN_ENTITIES = [
  'DeepAgents', 'LangChain', 'LangSmith',
  'Main Agent', 'Sub Agent',
  '事件流', '星形架构', '全链路追踪',
  'OpenAI', 'Claude', 'GPT', 'LLaMA',
  'RAG', 'Embedding', 'Vector DB'
];

// 实体提取配置
const CONFIG = {
  // 提取约束
  extraction: {
    minFrequency: 2,          // 最少出现次数
    minConfidence: 0.7,       // LLM置信度阈值
    maxNameLength: 30,        // 实体名最大长度
    maxNewPerDoc: 3,          // 每文档最多新实体数
    similarityThreshold: 0.8  // 相似度阈值（合并用）
  },
  
  // 禁止提取的黑名单
  blacklist: [
    '系统', '功能', '方法', '流程', '模块',
    '实现', '设计', '方案', '架构', '技术',
    '应用', '平台', '服务', '工具', '组件'
  ]
};

/**
 * 第一层：规则匹配提取
 * 零LLM开销，快速精准匹配
 */
function ruleBasedExtraction(content, existingEntities = []) {
  const entities = [];
  
  // 1. 精确匹配已知实体
  for (const entity of [...KNOWN_ENTITIES, ...existingEntities]) {
    const regex = new RegExp(`\\b${escapeRegex(entity)}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length >= CONFIG.extraction.minFrequency) {
      entities.push({
        name: entity,
        frequency: matches.length,
        source: 'exact_match',
        confidence: 1.0
      });
    }
  }
  
  // 2. 正则提取特定模式
  const patterns = [
    { regex: /([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\s+Agent)/g, type: 'agent' },
    { regex: /([A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)+)/g, type: 'framework' },
    { regex: /((?:前后端|全链路|动态|静态|分布式|中心化)\s*\w{2,6})/g, type: 'concept' }
  ];
  
  for (const { regex, type } of patterns) {
    const matches = content.match(regex) || [];
    for (const match of matches) {
      const cleanMatch = match.trim();
      if (isValidEntityName(cleanMatch) && !isBlacklisted(cleanMatch)) {
        entities.push({
          name: cleanMatch,
          frequency: 1,
          source: `pattern_${type}`,
          confidence: 0.8
        });
      }
    }
  }
  
  // 去重（保留最高置信度）
  return deduplicateEntities(entities);
}

/**
 * 第二层：LLM提取（有约束）
 * 仅处理规则未覆盖的高质量实体
 */
async function llmBasedExtraction(content, existingEntities = []) {
  const prompt = `你是一名知识库管理员，负责从文档中提取技术实体。

【任务】
从以下文档中提取关键实体（框架、工具、平台、核心概念）。

【已有实体列表】（不要重复提取）
${existingEntities.join(', ')}

【严格提取标准】（必须同时满足）
1. 技术实体：框架、工具、平台、协议、设计模式
2. 核心概念：架构模式、关键机制、标准规范
3. 在文档中出现≥2次或有专门章节介绍
4. 与已有实体语义不重复

【禁止提取】
- 通用词汇：系统、功能、方法、流程、模块、设计、方案
- 已有实体的变体：如已有"LangChain"不提取"LC"或"langchain库"
- 过于细粒度的实现细节：具体函数名、配置参数、版本号
- 形容词或描述性词汇

【输出格式】
返回 JSON 数组，最多3个实体：
[
  {
    "name": "实体名称",
    "type": "框架|工具|概念|组件",
    "definition": "一句话定义（20字以内）",
    "confidence": 0.95
  }
]

【文档内容】
${content.substring(0, 3000)}

只返回 JSON，不要其他说明。`;

  try {
    // 调用 LLM（这里使用外部传入的 llm 函数）
    const result = await callLLM(prompt);
    const entities = JSON.parse(result);
    
    // 过滤和验证
    return entities
      .filter(e => e.confidence >= CONFIG.extraction.minConfidence)
      .filter(e => isValidEntityName(e.name))
      .filter(e => !isBlacklisted(e.name))
      .filter(e => !isSimilarToExisting(e.name, existingEntities))
      .slice(0, CONFIG.extraction.maxNewPerDoc)
      .map(e => ({
        ...e,
        frequency: 1,
        source: 'llm_extracted'
      }));
  } catch (error) {
    console.error('LLM提取失败:', error);
    return [];
  }
}

/**
 * 第三层：过滤层
 */
function filterEntities(entities) {
  return entities.filter(e => {
    // 1. 长度过滤
    if (e.name.length > CONFIG.extraction.maxNameLength) {
      return false;
    }
    
    // 2. 频率过滤
    if (e.frequency < CONFIG.extraction.minFrequency && e.source !== 'llm_extracted') {
      return false;
    }
    
    // 3. 黑名单过滤
    if (isBlacklisted(e.name)) {
      return false;
    }
    
    // 4. 置信度过滤
    if (e.confidence < CONFIG.extraction.minConfidence) {
      return false;
    }
    
    return true;
  });
}

/**
 * 辅助函数：验证实体名有效性
 */
function isValidEntityName(name) {
  if (!name || name.length < 2) return false;
  if (name.length > CONFIG.extraction.maxNameLength) return false;
  if (/^[\d\s]+$/.test(name)) return false; // 纯数字或空格
  if (/^[a-z]$/.test(name)) return false;   // 单个小写字母
  return true;
}

/**
 * 辅助函数：检查黑名单
 */
function isBlacklisted(name) {
  return CONFIG.blacklist.some(b => 
    name.toLowerCase().includes(b.toLowerCase()) ||
    b.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * 辅助函数：检查与现有实体的相似度
 */
function isSimilarToExisting(name, existingEntities) {
  for (const existing of existingEntities) {
    const similarity = calculateSimilarity(name.toLowerCase(), existing.toLowerCase());
    if (similarity > CONFIG.extraction.similarityThreshold) {
      return true;
    }
  }
  return false;
}

/**
 * 辅助函数：计算字符串相似度（简单版）
 */
function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;
  
  // Levenshtein距离简化版
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  
  if (maxLen === 0) return 1.0;
  
  // 共同子串长度
  let common = 0;
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (str1[i] === str2[i]) common++;
  }
  
  return common / maxLen;
}

/**
 * 辅助函数：实体去重
 */
function deduplicateEntities(entities) {
  const seen = new Map();
  
  for (const e of entities) {
    const key = e.name.toLowerCase();
    if (!seen.has(key) || seen.get(key).confidence < e.confidence) {
      seen.set(key, e);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * 辅助函数：转义正则特殊字符
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 主提取函数（分层组合）
 */
async function extractEntities(content, options = {}) {
  const {
    existingEntities = [],
    useLLM = true,
    requireApproval = true
  } = options;
  
  // 第一层：规则提取
  const ruleEntities = ruleBasedExtraction(content, existingEntities);
  
  // 第二层：LLM提取（如果启用）
  let llmEntities = [];
  if (useLLM) {
    const allKnown = [...KNOWN_ENTITIES, ...existingEntities, ...ruleEntities.map(e => e.name)];
    llmEntities = await llmBasedExtraction(content, allKnown);
  }
  
  // 合并并去重
  const allEntities = [...ruleEntities, ...llmEntities];
  const uniqueEntities = deduplicateEntities(allEntities);
  
  // 第三层：过滤
  const filteredEntities = filterEntities(uniqueEntities);
  
  // 第四层：标记需审核的实体
  return filteredEntities.map(e => ({
    ...e,
    requiresApproval: requireApproval && e.source === 'llm_extracted' && e.confidence < 0.9
  }));
}

// 模拟LLM调用（实际使用时替换为真实调用）
async function callLLM(prompt) {
  // 这里应该调用实际的LLM API
  // 返回 JSON 字符串
  return '[]';
}

// 导出
module.exports = {
  extractEntities,
  ruleBasedExtraction,
  llmBasedExtraction,
  filterEntities,
  KNOWN_ENTITIES,
  CONFIG
};

// CLI用法示例
if (require.main === module) {
  const testContent = `
    本文档介绍基于 LangChain 和 LangGraph 的多 Agent 架构。
    Main Agent 负责调度，Sub Agent 执行任务。
    使用 LangSmith 进行追踪，支持事件流机制。
  `;
  
  extractEntities(testContent, { useLLM: false }).then(entities => {
    console.log('提取的实体:');
    console.table(entities);
  });
}
