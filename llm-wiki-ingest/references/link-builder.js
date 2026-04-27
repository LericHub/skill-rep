/**
 * 链接构建器 - 动态扫描实体/主题/归档文件夹
 * 
 * 设计理念：
 * 1. 零硬编码：运行时动态扫描文件系统
 * 2. 自动适应：新增/删除文件自动反映到链接映射
 * 3. 格式统一：支持本地相对路径和飞书URL两种格式
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

// 链接配置
const CONFIG = {
  // 本地路径配置
  local: {
    basePath: '/workspace/projects/workspace/llm-wiki/wiki',
    folders: {
      entities: 'entities',
      topics: 'topics',
      archive: 'archive',
      system: 'system'
    }
  },
  
  // 飞书配置
  feishu: {
    baseUrl: 'https://www.feishu.cn/wiki',
    spaceId: '7633348949482589405'
  },
  
  // 链接格式
  formats: {
    local: '[{name}]({path})',
    feishu: '[{name}]({url})'
  }
};

/**
 * 动态扫描构建链接映射
 * 从实际文件系统读取，不依赖硬编码
 */
async function buildLinkMap(options = {}) {
  const { 
    basePath = CONFIG.local.basePath,
    nodeTokenMap = {} // 飞书 node_token 映射（可选）
  } = options;
  
  const linkMap = {};
  
  // 1. 扫描实体文件夹
  try {
    const entityFiles = await glob('*.md', { 
      cwd: path.join(basePath, CONFIG.local.folders.entities) 
    });
    
    for (const file of entityFiles) {
      const name = path.basename(file, '.md');
      linkMap[name] = {
        name,
        type: 'entity',
        localPath: `./${CONFIG.local.folders.entities}/${encodeURIComponent(file)}`,
        nodeToken: nodeTokenMap[name] || null
      };
    }
  } catch (e) {
    console.warn('实体文件夹扫描失败:', e.message);
  }
  
  // 2. 扫描主题文件夹
  try {
    const topicFiles = await glob('*.md', { 
      cwd: path.join(basePath, CONFIG.local.folders.topics) 
    });
    
    for (const file of topicFiles) {
      const name = path.basename(file, '.md');
      linkMap[name] = {
        name,
        type: 'topic',
        localPath: `./${CONFIG.local.folders.topics}/${encodeURIComponent(file)}`,
        nodeToken: nodeTokenMap[name] || null
      };
    }
  } catch (e) {
    console.warn('主题文件夹扫描失败:', e.message);
  }
  
  // 3. 扫描归档文件夹
  try {
    const archiveFiles = await glob('*.md', { 
      cwd: path.join(basePath, CONFIG.local.folders.archive) 
    });
    
    for (const file of archiveFiles) {
      const name = path.basename(file, '.md');
      linkMap[name] = {
        name,
        type: 'archive',
        localPath: `./${CONFIG.local.folders.archive}/${encodeURIComponent(file)}`,
        nodeToken: nodeTokenMap[name] || null
      };
    }
  } catch (e) {
    console.warn('归档文件夹扫描失败:', e.message);
  }
  
  // 4. 扫描系统文件夹
  try {
    const systemFiles = await glob('*.md', { 
      cwd: path.join(basePath, CONFIG.local.folders.system) 
    });
    
    for (const file of systemFiles) {
      const name = path.basename(file, '.md');
      linkMap[name] = {
        name,
        type: 'system',
        localPath: `./${CONFIG.local.folders.system}/${encodeURIComponent(file)}`,
        nodeToken: nodeTokenMap[name] || null
      };
    }
  } catch (e) {
    console.warn('系统文件夹扫描失败:', e.message);
  }
  
  // 5. 特殊页面
  linkMap['首页'] = {
    name: '首页',
    type: 'special',
    localPath: './00-首页.md',
    nodeToken: nodeTokenMap['首页'] || null
  };
  
  linkMap['index'] = {
    name: 'index',
    type: 'special',
    localPath: './index.md',
    nodeToken: nodeTokenMap['index'] || null
  };
  
  linkMap['log'] = {
    name: 'log',
    type: 'special',
    localPath: `./${CONFIG.local.folders.system}/log.md`,
    nodeToken: nodeTokenMap['log'] || null
  };
  
  return linkMap;
}

/**
 * 生成本地格式链接
 * [实体名](./entities/实体名.md)
 */
function generateLocalLink(name, linkMap) {
  const entry = linkMap[name];
  if (!entry) return null;
  
  return `[${name}](${entry.localPath})`;
}

/**
 * 生成飞书格式链接
 * [实体名](https://www.feishu.cn/wiki/{node_token})
 */
function generateFeishuLink(name, linkMap) {
  const entry = linkMap[name];
  if (!entry || !entry.nodeToken) return null;
  
  return `[${name}](${CONFIG.feishu.baseUrl}/${entry.nodeToken})`;
}

/**
 * 批量生成链接（用于主题页、实体页等）
 */
function generateLinks(names, linkMap, format = 'local') {
  const links = [];
  const unmapped = [];
  
  for (const name of names) {
    const link = format === 'feishu' 
      ? generateFeishuLink(name, linkMap)
      : generateLocalLink(name, linkMap);
    
    if (link) {
      links.push(link);
    } else {
      unmapped.push(name);
    }
  }
  
  return { links, unmapped };
}

/**
 * 修复文件中的 Wiki 链接格式
 * 将 [[实体名]] 转换为标准 Markdown 链接
 */
async function fixWikiLinks(filePath, options = {}) {
  const {
    linkMap,
    format = 'local',
    dryRun = false
  } = options;
  
  // 如果没有提供 linkMap，动态构建
  const map = linkMap || await buildLinkMap();
  
  // 读取文件内容
  const content = await fs.readFile(filePath, 'utf-8');
  let modified = false;
  const unmapped = [];
  
  // 匹配 [[文本]] 格式
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  
  const newContent = content.replace(wikiLinkRegex, (match, linkText) => {
    const trimmedText = linkText.trim();
    
    // 检查是否在映射中
    if (map[trimmedText]) {
      modified = true;
      const link = format === 'feishu'
        ? generateFeishuLink(trimmedText, map)
        : generateLocalLink(trimmedText, map);
      return link || match;
    }
    
    // 未找到映射，记录
    unmapped.push(trimmedText);
    return match;
  });
  
  // 写入文件（如果不是 dryRun）
  if (modified && !dryRun) {
    await fs.writeFile(filePath, newContent, 'utf-8');
  }
  
  return {
    modified,
    unmapped: [...new Set(unmapped)], // 去重
    content: modified ? newContent : content
  };
}

/**
 * 批量修复目录中的所有 Markdown 文件
 */
async function fixAllWikiLinks(directory, options = {}) {
  const { format = 'local', dryRun = false } = options;
  
  // 构建链接映射
  const linkMap = await buildLinkMap();
  console.log(`📂 发现 ${Object.keys(linkMap).length} 个可链接目标`);
  
  // 查找所有 markdown 文件
  const files = await glob('**/*.md', { cwd: directory, absolute: true });
  
  const results = {
    fixed: [],
    skipped: [],
    unmapped: new Set()
  };
  
  for (const file of files) {
    const result = await fixWikiLinks(file, { linkMap, format, dryRun });
    
    if (result.modified) {
      results.fixed.push(path.relative(directory, file));
      console.log(`✅ 已修复: ${path.relative(directory, file)}`);
    } else {
      results.skipped.push(path.relative(directory, file));
    }
    
    result.unmapped.forEach(u => results.unmapped.add(u));
  }
  
  return {
    ...results,
    unmapped: Array.from(results.unmapped),
    linkMap
  };
}

/**
 * 生成主题页实体列表（带链接）
 */
async function generateTopicEntityList(topicName, entityNames, options = {}) {
  const { format = 'local', basePath = CONFIG.local.basePath } = options;
  
  const linkMap = await buildLinkMap({ basePath });
  const { links, unmapped } = generateLinks(entityNames, linkMap, format);
  
  let markdown = `## 🔗 关键实体\n\n`;
  
  if (format === 'feishu') {
    // 飞书格式：表格
    markdown += `| 实体 | 类型 | 一句话定义 |\n`;
    markdown += `|------|------|-----------|\n`;
    
    for (const name of entityNames) {
      const entry = linkMap[name];
      const link = entry ? generateFeishuLink(name, linkMap) : name;
      const type = entry?.type || '概念';
      markdown += `| ${link} | ${type} | 待补充 |\n`;
    }
  } else {
    // 本地格式：列表
    markdown += links.join('\n');
  }
  
  if (unmapped.length > 0) {
    markdown += `\n\n<!-- 未映射实体: ${unmapped.join(', ')} -->`;
  }
  
  return markdown;
}

/**
 * 生成归档文档的实体引用
 */
async function generateArchiveEntityRefs(entityNames, options = {}) {
  const { format = 'local', basePath = CONFIG.local.basePath } = options;
  
  const linkMap = await buildLinkMap({ basePath });
  const { links, unmapped } = generateLinks(entityNames, linkMap, format);
  
  let markdown = `## 🔗 生成的实体\n\n`;
  markdown += links.map(l => `- ${l}`).join('\n');
  
  if (unmapped.length > 0) {
    markdown += `\n\n<!-- 以下实体未创建页面: ${unmapped.join(', ')} -->`;
  }
  
  return markdown;
}

// 导出
module.exports = {
  buildLinkMap,
  generateLocalLink,
  generateFeishuLink,
  generateLinks,
  fixWikiLinks,
  fixAllWikiLinks,
  generateTopicEntityList,
  generateArchiveEntityRefs,
  CONFIG
};

// CLI用法示例
if (require.main === module) {
  const directory = process.argv[2] || CONFIG.local.basePath;
  
  fixAllWikiLinks(directory, { format: 'local', dryRun: false })
    .then(results => {
      console.log('\n📊 修复统计:');
      console.log(`   已修复: ${results.fixed.length} 个文件`);
      console.log(`   跳过: ${results.skipped.length} 个文件`);
      
      if (results.unmapped.length > 0) {
        console.log(`\n⚠️  未找到映射的链接 (${results.unmapped.length} 个):`);
        results.unmapped.forEach(u => console.log(`   - ${u}`));
      }
    })
    .catch(console.error);
}
