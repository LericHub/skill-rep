/**
 * 全自动动态主题管理器
 * 
 * 核心特性：
 * - 实时决策：每篇文档摄取时立即分析
 * - 无待分类池：直接处理，无积压
 * - LLM自主：全自动决策，无需人工干预
 * - 高门槛：多重保障防止主题泛滥
 */

// 严格阈值配置
const CONFIG = {
  // 决策阈值
  thresholds: {
    mergeThreshold: 0.7,      // 归入现有主题的相似度门槛
    createThreshold: 0.4,     // 创建新主题的相似度上限
    minUniqueness: 0.6        // 独特性最低要求
  },
  
  // 数量限制（防泛滥）
  limits: {
    maxTopics: 10,            // 最多主题数
    minDocsPerTopic: 2        // 主题最少文档数
  },
  
  // 自动维护
  maintenance: {
    enable: true,
    checkInterval: '7 days',  // 检查周期
    mergeSimilarity: 0.8      // 自动合并相似度
  }
};

/**
 * 主题决策Prompt
 */
function buildDecisionPrompt(doc, existingTopics) {
  const topicsStr = existingTopics.length > 0 
    ? existingTopics.map((t, i) => 
        `${i+1}. ${t.name}: ${t.description || '无描述'} (关键词: ${(t.keywords || []).join(', ')})`
      ).join('\n')
    : '（暂无现有主题）';
  
  return `你是一名知识架构师，负责分析文档应归入现有主题还是创建新主题。

【文档信息】
标题：${doc.title}
内容摘要：${doc.content?.substring(0, 1500) || '无内容'}

【现有主题】${topicsStr}

【分析任务】
1. 提取文档的核心概念（3-5个关键词或技术术语）
2. 评估与每个现有主题的匹配度（0-1分，1为完全匹配）
3. 评估文档的独特性（是否包含现有主题未覆盖的新概念，0-1分）
4. 做出决策：
   - MERGE：归入最匹配的现有主题（当最高分≥0.7）
   - CREATE：创建新主题（当最高分<0.4，或0.4-0.7但独特性≥0.6）

【输出格式】
返回JSON格式：
{
  "coreConcepts": ["概念1", "概念2", "概念3"],
  "matches": [
    {"topicName": "主题名", "score": 0.85, "reason": "匹配理由"}
  ],
  "uniqueness": 0.75,
  "decision": "MERGE|CREATE",
  "targetTopic": "MERGE时填写目标主题名",
  "newTopic": {
    "name": "CREATE时填写新主题名（简洁明确）",
    "description": "一句话定义（15字以内）",
    "keywords": ["关键词1", "关键词2", "关键词3"]
  },
  "confidence": 0.92,
  "reasoning": "决策理由（30字以内）"
}`;
}

/**
 * 分析文档并决策主题
 */
async function analyzeTopic(doc, existingTopics = [], llmCaller) {
  // 特殊情况：无现有主题
  if (existingTopics.length === 0) {
    // 直接创建首个主题
    const analysis = await llmCaller(`分析以下文档，生成首个主题：

标题：${doc.title}
内容：${doc.content?.substring(0, 1500)}

输出JSON：
{
  "coreConcepts": ["概念1", "概念2"],
  "newTopic": {
    "name": "主题名",
    "description": "一句话定义",
    "keywords": ["关键词1", "关键词2"]
  }
}`);
    
    return {
      decision: 'CREATE',
      newTopic: analysis.newTopic,
      coreConcepts: analysis.coreConcepts,
      confidence: 1.0,
      reasoning: '首个主题，自动创建'
    };
  }
  
  // 正常决策流程
  const prompt = buildDecisionPrompt(doc, existingTopics);
  const result = await llmCaller(prompt);
  
  // 解析和验证结果
  const analysis = typeof result === 'string' ? JSON.parse(result) : result;
  
  // 后处理决策逻辑
  const bestMatch = analysis.matches?.[0];
  const bestScore = bestMatch?.score || 0;
  
  // 强制归入：相似度极高
  if (bestScore >= CONFIG.thresholds.mergeThreshold) {
    return {
      decision: 'MERGE',
      targetTopic: bestMatch.topicName,
      coreConcepts: analysis.coreConcepts,
      confidence: bestScore,
      reasoning: `与"${bestMatch.topicName}"高度匹配(${bestScore.toFixed(2)})`
    };
  }
  
  // 强制创建：相似度极低
  if (bestScore < CONFIG.thresholds.createThreshold) {
    return {
      decision: 'CREATE',
      newTopic: analysis.newTopic,
      coreConcepts: analysis.coreConcepts,
      uniqueness: analysis.uniqueness,
      confidence: 1 - bestScore,
      reasoning: `与现有主题匹配度低(${bestScore.toFixed(2)})，适合新建主题`
    };
  }
  
  // 中间区域：根据独特性决定
  if (analysis.uniqueness >= CONFIG.thresholds.minUniqueness) {
    return {
      decision: 'CREATE',
      newTopic: analysis.newTopic,
      coreConcepts: analysis.coreConcepts,
      uniqueness: analysis.uniqueness,
      confidence: analysis.uniqueness,
      reasoning: `匹配度中等但独特性高(${analysis.uniqueness.toFixed(2)})，创建新主题`
    };
  }
  
  // 兜底：归入最接近的
  return {
    decision: 'MERGE',
    targetTopic: bestMatch?.topicName || existingTopics[0]?.name,
    coreConcepts: analysis.coreConcepts,
    confidence: bestScore,
    reasoning: `边缘情况，归入最接近主题"${bestMatch?.topicName}"`
  };
}

/**
 * 检查主题数量限制
 */
function checkTopicLimit(existingTopics, decision) {
  // 如果已达上限且要创建新主题
  if (existingTopics.length >= CONFIG.limits.maxTopics && decision.decision === 'CREATE') {
    console.log(`⚠️ 主题数量已达上限(${CONFIG.limits.maxTopics})，强制归入现有主题`);
    
    // 找到最匹配的现有主题
    const bestMatch = decision.matches?.sort((a, b) => b.score - a.score)[0];
    
    return {
      ...decision,
      decision: 'MERGE',
      targetTopic: bestMatch?.topicName || existingTopics[0]?.name,
      reason: '主题数量限制'
    };
  }
  
  return decision;
}

/**
 * 比较两个主题的相似度
 */
async function compareTopics(topic1, topic2, llmCaller) {
  const prompt = `比较以下两个主题的相似度：

主题1：${topic1.name}
描述：${topic1.description || '无'}
关键词：${(topic1.keywords || []).join(', ')}

主题2：${topic2.name}
描述：${topic2.description || '无'}
关键词：${(topic2.keywords || []).join(', ')}

输出JSON：{"similarity": 0.85, "reason": "相似原因"}`;

  const result = await llmCaller(prompt);
  return typeof result === 'string' ? JSON.parse(result) : result;
}

/**
 * 自动维护：合并相似主题
 */
async function autoMergeTopics(existingTopics, llmCaller, mergeFn) {
  const merges = [];
  
  for (let i = 0; i < existingTopics.length; i++) {
    for (let j = i + 1; j < existingTopics.length; j++) {
      const t1 = existingTopics[i];
      const t2 = existingTopics[j];
      
      const comparison = await compareTopics(t1, t2, llmCaller);
      
      if (comparison.similarity >= CONFIG.maintenance.mergeSimilarity) {
        console.log(`🔄 发现相似主题: "${t1.name}" + "${t2.name}" (相似度: ${comparison.similarity.toFixed(2)})`);
        
        merges.push({
          topic1: t1,
          topic2: t2,
          similarity: comparison.similarity,
          reason: comparison.reason
        });
      }
    }
  }
  
  // 执行合并
  for (const merge of merges) {
    await mergeFn(merge.topic1, merge.topic2);
  }
  
  return merges;
}

/**
 * 自动维护：清理低质量主题
 */
async function autoCleanupTopics(existingTopics, getDocCountFn, migrateFn) {
  const cleaned = [];
  
  for (const topic of existingTopics) {
    const docCount = await getDocCountFn(topic);
    
    if (docCount < CONFIG.limits.minDocsPerTopic) {
      console.log(`⚠️ 主题"${topic.name}"文档过少(${docCount})，准备迁移`);
      
      // 找到最相似的其他主题
      const otherTopics = existingTopics.filter(t => t.name !== topic.name);
      if (otherTopics.length > 0) {
        // 简单策略：归入第一个其他主题
        // 实际应使用compareTopics找到最相似的
        await migrateFn(topic, otherTopics[0]);
        cleaned.push(topic);
      }
    }
  }
  
  return cleaned;
}

/**
 * 生成新主题内容
 */
function generateTopicContent(topic, documents, entities) {
  const entityLinks = entities.map(e => 
    `- [${e.name}](./entities/${encodeURIComponent(e.name)}.md)`
  ).join('\n');
  
  const docLinks = documents.map(d =>
    `- [${d.title}](./archive/${encodeURIComponent(d.title)}.md)`
  ).join('\n');
  
  return `# ${topic.name}

**最后更新**: ${new Date().toISOString().split('T')[0]}
**文档数**: ${documents.length}
**实体数**: ${entities.length}

---

## 📝 核心概念摘要

${topic.description}

**关键词**: ${topic.keywords?.join(', ') || '待补充'}

---

## 🔗 关键实体

| 实体 | 类型 | 一句话定义 |
|------|------|-----------|
${entities.map(e => `| [${e.name}](./entities/${encodeURIComponent(e.name)}.md) | ${e.type || '概念'} | ${e.definition || '待补充'} |`).join('\n')}

---

## 📦 来源文档

${docLinks || '（暂无）'}

---

## 🎯 快速查询

（待补充常见问题）
`;
}

// 导出
module.exports = {
  analyzeTopic,
  checkTopicLimit,
  compareTopics,
  autoMergeTopics,
  autoCleanupTopics,
  generateTopicContent,
  CONFIG
};
