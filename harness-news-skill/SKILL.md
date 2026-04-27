# Harness Engineering AI Agent News Aggregator

获取Harness Engineering平台的每日AI Agent新闻汇总，专注于生产级AI Agent部署、监控和治理的最佳实践。

## 适用场景

当你需要：
- 获取最新AI Agent工程化动态
- 了解生产环境中的Agent部署实践
- 追踪AI Agent工具和框架更新
- 阅读每日AI Agent新闻汇总

## 使用方法

直接发送：
```
获取Harness Engineering新闻
```

或
```
 Harness Engineering最新消息
```

## 触发词

- Harness Engineering新闻
- AI Agent新闻
- Harness Engineering最新消息

## 功能说明

1. **自动抓取**: 从harness-engineering.ai抓取最新文章
2. **优先排序**: 优先展示"Daily AI Agent News Roundup"系列
3. **日期提取**: 自动提取文章发布日期
4. **去重处理**: 自动去除重复链接
5. **格式化输出**: 结构化的新闻列表

## 数据来源

- 官网: https://harness-engineering.ai/
- 重点内容:
  - Daily AI Agent News Roundup
  - Agent Harness部署指南
  - 生产环境最佳实践
  - AI Agent治理框架

## 输出格式

```json
[
  {
    "source": "Harness Engineering",
    "title": "Daily AI Agent News Roundup — April 4, 2026",
    "url": "https://harness-engineering.ai/blog/...",
    "time": "April 4, 2026",
    "heat": "AI Agent News"
  }
]
```

## 技术特点

- 使用BeautifulSoup解析HTML
- 智能日期提取（支持多种格式）
- URL去重和优先级排序
- 错误处理和降级机制

## 限制

- 仅抓取公开内容
- 每次最多返回10条
- 不包含文章全文，仅提供标题和链接
