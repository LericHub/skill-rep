#!/usr/bin/env node

/**
 * LLM Wiki Ingest - Simplified Script for Skill
 *
 * 快速摄取飞书待处理文件夹中的文档
 */

const { execSync } = require('child_process');
const path = require('path');

const LLW_WIKI_PATH = '/workspace/projects/workspace/llm-wiki';

/**
 * 执行命令并返回结果
 */
function execCommand(command, description) {
  try {
    console.log(`\n${description}...`);
    const result = execSync(command, {
      cwd: LLW_WIKI_PATH,
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    console.log(`✅ ${description} 完成`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    return false;
  }
}

/**
 * 主流程
 */
async function main() {
  console.log('🚀 LLM Wiki Ingest - 开始摄取文档\n');
  console.log('='.repeat(60));

  const steps = [
    {
      command: 'node scripts/ingest.js',
      description: '执行 Ingest 流程'
    }
  ];

  const results = [];
  for (const step of steps) {
    const success = execCommand(step.command, step.description);
    results.push(success);
  }

  console.log('\n' + '='.repeat(60));
  if (results.every(r => r)) {
    console.log('🎉 所有步骤完成！');
  } else {
    console.log('⚠️  部分步骤失败，请检查日志');
  }
  console.log('='.repeat(60));
}

// 运行
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ 错误:', error);
    process.exit(1);
  });
}

module.exports = { main };
