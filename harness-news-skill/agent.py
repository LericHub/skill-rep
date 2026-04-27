#!/usr/bin/env python3
"""
OpenClaw Skill: Harness Engineering News Aggregator
"""

import sys
import os
import json

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))

from fetch_harness import fetch_harness_news

def skill_trigger(message: str, context: dict = None) -> dict:
    """
    Main entry point for the skill.

    Args:
        message (str): User message
        context (dict): Additional context

    Returns:
        dict: Response with type and content
    """
    # Check if this is a trigger
    triggers = [
        'harness engineering',
        'ai agent新闻',
        'ai agent news',
        'harness'
    ]

    message_lower = message.lower()
    if not any(trigger in message_lower for trigger in triggers):
        return {
            "type": "skip",
            "content": None
        }

    # Extract limit if specified
    limit = 10
    import re
    limit_match = re.search(r'(\d+)\s*(条|个|篇|items?)', message)
    if limit_match:
        limit = min(int(limit_match.group(1)), 20)

    # Extract keyword if specified
    keyword = None
    if '关键词' in message or 'keyword' in message_lower:
        # Try to extract keyword after "关键词" or "keyword"
        keyword_match = re.search(r'(关键词|keyword)[:：]\s*(.+)', message)
        if keyword_match:
            keyword = keyword_match.group(2).strip()

    # Fetch news
    items = fetch_harness_news(limit=limit, keyword=keyword)

    if not items:
        return {
            "type": "text",
            "content": "❌ 未能获取Harness Engineering新闻，请稍后重试。"
        }

    # Format response
    roundup_count = sum(1 for item in items if "Daily AI Agent News Roundup" in item['title'])

    response_lines = [
        f"## 📰 Harness Engineering AI Agent新闻",
        f"共获取 **{len(items)}** 条新闻（其中 **{roundup_count}** 条每日汇总）",
        "",
        "### 📋 新闻列表",
        ""
    ]

    for i, item in enumerate(items, 1):
        title = item['title']
        date = item['time']
        url = item['url']
        is_roundup = "Daily AI Agent News Roundup" in title

        if is_roundup:
            response_lines.append(f"**{i}. 🎯 {title}**")
        else:
            response_lines.append(f"**{i}.** {title}")

        response_lines.append(f"   📅 {date}")
        response_lines.append(f"   🔗 {url}")
        response_lines.append("")

    response_lines.append("---")
    response_lines.append("💡 **提示**: 优先展示每日AI Agent新闻汇总，包含生产环境部署、监控和治理的最佳实践。")

    return {
        "type": "markdown",
        "content": "\n".join(response_lines)
    }

if __name__ == "__main__":
    # Test the skill
    test_messages = [
        "获取Harness Engineering新闻",
        "AI Agent新闻 5条",
        "Harness Engineering最新消息"
    ]

    for msg in test_messages:
        print(f"\n🧪 测试: {msg}")
        print("-" * 50)
        result = skill_trigger(msg)
        print(result['content'][:300] + "...")
