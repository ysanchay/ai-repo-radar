# AI Repo Radar ⚡

> **Trending AI repositories, refreshed daily**

A daily dashboard of trending AI/LLM GitHub repositories. Discover the fastest-growing open-source projects in artificial intelligence — curated and updated every day.

## Features

- **Daily Refresh** — GitHub Actions pipeline fetches trending repos daily
- **Velocity Score** — Proprietary ranking that measures growth momentum
- **Smart Categories** — Filter by LLM, Agents, Vision, Audio, Multimodal, Tools, Frameworks
- **AI Summaries** — Auto-generated summaries for every repo
- **Archive Browser** — Explore past days to see how trends evolve
- **Share & Discover** — Share repos on Twitter/LinkedIn, browse related projects

## Project Structure

```
aireporadar/
├── index.html              # Homepage — repo cards sorted by velocity
├── repo.html               # Single repo detail page
├── archive.html            # Past days archive browser
├── style.css               # Dark minimal design system
├── app.js                  # All frontend logic
├── data/
│   ├── repos.json          # Today's repos (auto-refreshed)
│   └── archive/            # Historical daily snapshots
│       ├── index.json      # Available dates
│       └── YYYY-MM-DD.json # Daily archive files
├── scripts/
│   └── fetch_repos.py      # GitHub API data pipeline
├── .github/workflows/
│   └── daily-refresh.yml   # Daily CI/CD pipeline
├── wrangler.toml           # Cloudflare Pages config
├── robots.txt
├── sitemap.xml
└── README.md
```

## Setup & Deploy

### Local Development

```bash
# Serve with any static server
python3 -m http.server 8000
npx serve .
```

### Deploy to Cloudflare Pages

**Option 1: GitHub Integration (Recommended)**
1. Push this repo to GitHub
2. In Cloudflare Pages dashboard, connect the repo
3. Set build command: (none — static site)
4. Set output directory: `.` (root)
5. Deploy!

**Option 2: Wrangler CLI**
```bash
npx wrangler pages deploy . --project-name=aireporadar
```

### Environment Secrets (GitHub Actions)

Set in GitHub repo Settings → Secrets and Variables → Actions:

| Secret | Purpose |
|--------|---------|
| `GH_PAT` | GitHub Personal Access Token for repo fetching |
| `CF_API_TOKEN` | Cloudflare API token for Pages deployment |
| `CF_ACCOUNT_ID` | Cloudflare account ID |

## How It Works

1. **GitHub Actions** runs `scripts/fetch_repos.py` daily at midnight UTC
2. The script searches GitHub for trending AI/LLM repos (pushed in last 7 days)
3. Computes **velocity scores** (growth momentum), categorizes repos, generates summaries
4. Saves to `data/repos.json` and archives to `data/archive/{date}.json`
5. Commits changes back and triggers a Cloudflare Pages rebuild
6. The static site renders everything client-side from the JSON data

## Velocity Score

Velocity measures growth momentum. Higher = faster-growing:

- 🔥🔥 **90-100**: Explosive growth (viral repos)
- 🔥 **80-89**: Very hot (fastest movers)
- 📈 **60-79**: Strong momentum
- 📊 **40-59**: Steady growth
- 📉 **0-39**: Established/mature or slow

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (zero dependencies)
- **Styling**: Dark minimal design, glassmorphism cards, CSS animations
- **Data Pipeline**: Python + GitHub REST API v3
- **CI/CD**: GitHub Actions
- **Hosting**: Cloudflare Pages

---

Built by **SanCompany** · [aireporadar.pages.dev](https://aireporadar.pages.dev)
