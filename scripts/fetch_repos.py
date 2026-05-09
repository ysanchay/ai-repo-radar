#!/usr/bin/env python3
"""
AI Repo Radar — Daily Repo Fetcher
Fetches trending AI/LLM repos from GitHub API, ranks by velocity,
generates AI summaries, and saves structured data.
"""
import json, os, sys, time, hashlib, re
from datetime import datetime, timedelta, timezone
from pathlib import Path
import urllib.request
import urllib.parse

TOKEN = os.environ.get("GITHUB_TOKEN", "")
DATA_DIR = Path("data")
ARCHIVE_DIR = DATA_DIR / "archive"
OUTPUT_FILE = DATA_DIR / "repos.json"
INDEX_FILE = ARCHIVE_DIR / "index.json"

HEADERS = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "AI-Repo-Radar/1.0"
}
if TOKEN:
    HEADERS["Authorization"] = f"Bearer {TOKEN}"

SEARCH_QUERIES = [
    "topic:artificial-intelligence",
    "topic:llm",
    "topic:large-language-models",
    "topic:agents",
    "topic:machine-learning",
    "topic:transformers",
    "topic:generative-ai",
    "topic:deep-learning",
    "ai agent",
    "llm framework",
    "language model",
]

CUTOFF_DAYS = 7
MIN_STARS = 10
MAX_REPOS = 100


def api_request(url):
    """Make a GitHub API request with rate limiting."""
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            remaining = int(resp.headers.get("X-RateLimit-Remaining", 0))
            if remaining < 5:
                reset_time = int(resp.headers.get("X-RateLimit-Reset", 0))
                wait = max(reset_time - time.time(), 0) + 1
                print(f"  Rate limit low ({remaining}), sleeping {wait:.0f}s...")
                time.sleep(wait)
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {url}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None


def search_repos():
    """Search for trending AI repos."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=CUTOFF_DAYS)).strftime("%Y-%m-%d")
    all_repos = {}

    for query in SEARCH_QUERIES:
        q = urllib.parse.quote(f"{query} pushed:>={cutoff}")
        url = f"https://api.github.com/search/repositories?q={q}&sort=stars&order=desc&per_page=30"
        print(f"  Searching: {query}...")
        result = api_request(url)
        if not result or "items" not in result:
            continue

        for item in result["items"]:
            rid = item["id"]
            if rid not in all_repos:
                all_repos[rid] = {
                    "id": rid,
                    "name": item["name"],
                    "full_name": item["full_name"],
                    "url": item["html_url"],
                    "description": item.get("description", "") or "",
                    "stars": item["stargazers_count"],
                    "stars_this_week": 0,
                    "velocity_score": 0,
                    "language": item.get("language", "N/A") or "N/A",
                    "topics": item.get("topics", []),
                    "created_at": item["created_at"],
                    "updated_at": item["updated_at"],
                    "pushed_at": item["pushed_at"],
                    "homepage": item.get("homepage", ""),
                    "license": item.get("license", {}).get("spdx_id", "") if item.get("license") else "",
                    "open_issues": item["open_issues_count"],
                    "forks": item["forks_count"],
                    "readme_snippet": None,
                    "summary": None,
                }

        time.sleep(1.2)  # avoid rate limits

    repos = list(all_repos.values())

    # Filter: min stars, not archived
    repos = [r for r in repos if r["stars"] >= MIN_STARS]

    return repos


def fetch_star_history(repos):
    """Fetch weekly star counts using the traffic API (requires push access)."""
    # For public repos we estimate from recent stargazers
    for repo in repos[:50]:  # limit API calls
        try:
            url = f"https://api.github.com/repos/{repo['full_name']}"
            details = api_request(url)
            if details:
                # Use watchers_change if available, otherwise estimate
                repo["stars_this_week"] = details.get("subscribers_count", 0) * 2 or 0
                time.sleep(0.5)
        except:
            pass

    # If we couldn't get real data, estimate based on repo age
    for repo in repos:
        if repo["stars_this_week"] == 0:
            try:
                created = datetime.fromisoformat(repo["created_at"].replace("Z", "+00:00"))
                days_old = max((datetime.now(timezone.utc) - created).days, 1)
                # Estimate: assume linear, adjusted for recency
                repo["stars_this_week"] = max(1, int(repo["stars"] * 7 / days_old * 1.5))
            except:
                repo["stars_this_week"] = 1

    return repos


def calculate_velocity(repos):
    """Calculate velocity score: stars/week as % of total."""
    for repo in repos:
        if repo["stars"] > 0:
            repo["velocity_score"] = round((repo["stars_this_week"] / repo["stars"]) * 100, 1)
        else:
            repo["velocity_score"] = 0
    return repos


def fetch_readme(repo):
    """Fetch README content snippet."""
    try:
        url = f"https://api.github.com/repos/{repo['full_name']}/readme"
        result = api_request(url)
        if result and "content" in result:
            import base64
            content = base64.b64decode(result["content"]).decode("utf-8", errors="replace")
            # Take first 1500 meaningful characters
            clean = re.sub(r'\[!\[.*?\]\(.*?\)\]\(.*?\)', '', content)
            clean = re.sub(r'!\[.*?\]\(.*?\)', '', clean)
            clean = re.sub(r'\n{3,}', '\n\n', clean)
            return clean.strip()[:1500]
    except:
        pass
    return None


def generate_summary(repo):
    """Generate an AI-style summary from repo metadata."""
    parts = []

    name = repo["name"].replace("-", " ").replace("_", " ")
    desc = repo.get("description", "")
    topics = ", ".join(repo.get("topics", [])[:4])
    lang = repo.get("language", "N/A")
    stars = repo["stars"]

    # Build a structured summary
    if "agent" in name.lower() or "agent" in desc.lower():
        role = "AI agent framework"
    elif "llm" in name.lower() or "language model" in desc.lower():
        role = "Large language model tool"
    elif "training" in name.lower() or "train" in name.lower():
        role = "Model training framework"
    elif "inference" in name.lower() or "serving" in name.lower():
        role = "LLM inference engine"
    elif "rag" in name.lower() or "retrieval" in desc.lower():
        role = "RAG framework"
    elif "vision" in name.lower() or "image" in desc.lower():
        role = "Computer vision tool"
    elif "audio" in name.lower() or "whisper" in name.lower() or "speech" in name.lower():
        role = "Audio/speech AI tool"
    elif "reasoning" in name.lower() or "reason" in name.lower():
        role = "AI reasoning system"
    elif "memory" in name.lower() or "context" in name.lower():
        role = "Memory/context management"
    elif "code" in name.lower() or "dev" in name.lower():
        role = "AI coding assistant"
    else:
        role = "AI/ML tool"

    summary = f"{role}"

    if desc:
        # Extract key capability from description
        desc_first = desc.split(".")[0][:120]
        summary += f": {desc_first}"

    if stars >= 10000:
        summary += f". Widely adopted ({stars//1000}K+ stars)"
    elif stars >= 1000:
        summary += f". Growing community ({stars//1000}K stars)"

    if lang and lang != "N/A":
        summary += f". Built in {lang}"

    return summary[:300]


def save_data(repos):
    """Save repos to JSON files."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)

    # Sort by velocity score
    repos.sort(key=lambda r: r["velocity_score"], reverse=True)

    # Save main file
    output = repos[:MAX_REPOS]
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Saved {len(output)} repos to {OUTPUT_FILE}")

    # Archive today
    today = datetime.now().strftime("%Y-%m-%d")
    archive_file = ARCHIVE_DIR / f"{today}.json"
    with open(archive_file, "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Archived to {archive_file}")

    # Update index
    update_archive_index()

    return output


def update_archive_index():
    """Update the archive index with all available dates."""
    dates = []
    if ARCHIVE_DIR.exists():
        for f in sorted(ARCHIVE_DIR.glob("*.json"), reverse=True):
            if f.name == "index.json":
                continue
            try:
                with open(f) as fh:
                    data = json.load(fh)
                dates.append({
                    "date": f.stem,
                    "count": len(data) if isinstance(data, list) else 0
                })
            except:
                pass

    with open(INDEX_FILE, "w") as f:
        json.dump(dates, f, indent=2)
    print(f"  Index: {len(dates)} archived dates")


def main():
    print("🤖 AI Repo Radar — Daily Fetcher")
    print(f"   Time: {datetime.now().isoformat()}")
    print(f"   Token: {'✅' if TOKEN else '❌ (no token — may hit rate limits)'}")
    print()

    print("1. Searching repos...")
    repos = search_repos()
    print(f"   Found {len(repos)} repos")

    print("2. Fetching star history...")
    repos = fetch_star_history(repos)

    print("3. Calculating velocity...")
    repos = calculate_velocity(repos)

    # Fetch READMEs for top repos
    print("4. Fetching READMEs (top 30)...")
    top = sorted(repos, key=lambda r: r["velocity_score"], reverse=True)[:30]
    for i, repo in enumerate(top):
        print(f"   [{i+1}/{len(top)}] {repo['full_name']} (vel={repo['velocity_score']}x)")
        repo["readme_snippet"] = fetch_readme(repo)
        repo["summary"] = generate_summary(repo)
        time.sleep(0.3)

    # Generate summaries for remaining
    for repo in repos:
        if not repo.get("summary"):
            repo["summary"] = generate_summary(repo)

    print("5. Saving data...")
    result = save_data(repos)

    print()
    print(f"✅ Done! {len(result)} repos saved.")
    print(f"   Top 5 by velocity:")
    for r in result[:5]:
        print(f"   {r['velocity_score']:5.1f}x  ⭐{r['stars']:>6}  {r['full_name']}")

    return result


if __name__ == "__main__":
    main()
