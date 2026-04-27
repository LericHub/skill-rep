#!/usr/bin/env python3
"""
Fetch Harness Engineering AI Agent News
抓取Harness Engineering平台的每日AI Agent新闻汇总
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import sys

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def fetch_harness_news(limit=10, keyword=None):
    """
    Fetch daily AI agent news roundup from Harness Engineering.

    Args:
        limit (int): Maximum number of articles to return
        keyword (str): Filter articles by keyword (optional)

    Returns:
        list: List of article dictionaries
    """
    items = []
    try:
        url = "https://harness-engineering.ai/"
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Look for article links in the main content
        for link in soup.find_all('a', href=True):
            href = link.get('href')

            # Filter for blog post URLs
            if '/blog/' not in href:
                continue

            # Get full URL
            if href.startswith('http'):
                full_url = href
            elif href.startswith('/'):
                full_url = f"https://harness-engineering.ai{href}"
            else:
                continue

            # Get title text
            title = link.get_text(strip=True)

            # Skip empty titles
            if not title or len(title) < 10:
                continue

            # Extract date
            date_str = ""
            # Try from title first (e.g., "Daily AI Agent News Roundup — April 4, 2026")
            date_match = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}', title)
            if date_match:
                date_str = date_match.group(0)
            elif not date_str:
                # Fallback to simpler pattern
                date_match = re.search(r'(\w+)\s+(\d{1,2}),?\s+(\d{4})', title)
                if date_match:
                    month = date_match.group(1)
                    day = date_match.group(2)
                    year = date_match.group(3)
                    date_str = f"{month} {day}, {year}"

            items.append({
                "source": "Harness Engineering",
                "title": title,
                "url": full_url,
                "time": date_str or "Recent",
                "heat": "AI Agent News"
            })

        # Remove duplicates (same URL)
        seen_urls = set()
        unique_items = []
        for item in items:
            if item['url'] not in seen_urls:
                seen_urls.add(item['url'])
                unique_items.append(item)

        # Prioritize "Daily AI Agent News Roundup" articles
        roundup_items = [item for item in unique_items if "Daily AI Agent News Roundup" in item['title']]
        other_items = [item for item in unique_items if "Daily AI Agent News Roundup" not in item['title']]

        # Return roundups first, then other articles
        prioritized = roundup_items + other_items

        # Apply keyword filter if provided
        if keyword:
            keyword_lower = keyword.lower()
            prioritized = [item for item in prioritized if keyword_lower in item['title'].lower()]

        return prioritized[:limit]

    except Exception as e:
        print(f"[ERROR] Harness Engineering fetch failed: {e}", file=sys.stderr)
        return []

def main():
    """Main entry point for command-line usage"""
    import argparse

    parser = argparse.ArgumentParser(description="Fetch Harness Engineering AI Agent News")
    parser.add_argument('--limit', type=int, default=10, help='Maximum number of articles')
    parser.add_argument('--keyword', help='Filter by keyword')
    parser.add_argument('--output', choices=['json', 'text'], default='json', help='Output format')

    args = parser.parse_args()

    result = fetch_harness_news(limit=args.limit, keyword=args.keyword)

    if args.output == 'json':
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        for item in result:
            print(f"📰 {item['title']}")
            print(f"   📅 {item['time']}")
            print(f"   🔗 {item['url']}")
            print()

if __name__ == "__main__":
    main()
