#!/usr/bin/env python3
"""
AI Repo Radar — Site Freshness Monitor
Checks if usefreetools.dev has today's data. Alerts if stale.
"""
import json, urllib.request, os, sys
from datetime import datetime, timezone, timedelta

SITE_URL = "https://usefreetools.dev/data/archive/index.json"
TELEGRAM_CHAT_ID = "569934324"
ALERT_THRESHOLD_DAYS = 1  # Alert if data is older than 1 day

def get_today_str():
    ist = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist).strftime('%Y-%m-%d')

def fetch_index():
    req = urllib.request.Request(SITE_URL, headers={"User-Agent": "AI-Repo-Radar-Monitor/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.load(resp)
    except Exception as e:
        return {"error": str(e)}

def send_telegram_alert(message):
    try:
        config_path = os.path.expanduser("~/.openclaw/openclaw.json")
        with open(config_path) as f:
            config = json.load(f)
        token = config.get("channels", {}).get("telegram", {}).get("botToken", "")
        if not token:
            return False
        import urllib.parse
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = urllib.parse.urlencode({"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "Markdown"}).encode()
        req = urllib.request.Request(url, data=data, method="POST")
        with urllib.request.urlopen(req, timeout=15):
            return True
    except Exception as e:
        print(f"Failed to send alert: {e}")
        return False

def check_github_actions():
    """Check if last GitHub Actions run failed"""
    try:
        req = urllib.request.Request(
            "https://api.github.com/repos/ysanchay/ai-repo-radar/actions/runs?per_page=1",
            headers={"User-Agent": "AI-Repo-Radar-Monitor/1.0", "Accept": "application/vnd.github+json"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.load(resp)
            if data.get("workflow_runs"):
                run = data["workflow_runs"][0]
                return run.get("conclusion"), run.get("html_url")
    except Exception:
        pass
    return None, None

def main():
    today = get_today_str()
    index = fetch_index()

    if "error" in index:
        alert = f"🚨 *AI Repo Radar — Site Down*\n\nCould not reach usefreetools.dev\nError: {index['error']}\n\nTime: {today}"
        send_telegram_alert(alert)
        print(alert)
        sys.exit(1)

    latest_date = index[0]["date"] if index else None
    days_stale = 0

    if latest_date:
        d1 = datetime.strptime(today, "%Y-%m-%d")
        d2 = datetime.strptime(latest_date, "%Y-%m-%d")
        days_stale = (d1 - d2).days

    # Check GitHub Actions status
    gh_status, gh_url = check_github_actions()

    if days_stale > ALERT_THRESHOLD_DAYS:
        alert_parts = [f"🚨 *AI Repo Radar — STALE DATA*\n\n"]
        alert_parts.append(f"• Live site date: `{latest_date or 'UNKNOWN'}`\n")
        alert_parts.append(f"• Expected date: `{today}`\n")
        alert_parts.append(f"• Days stale: `{days_stale}`\n")
        if gh_status == "failure":
            alert_parts.append(f"• GitHub Actions: ❌ FAILED\n")
            alert_parts.append(f"• [View failed run]({gh_url})\n")
        alert_parts.append(f"\n_Action needed: Run local deploy or fix GH Actions token_\n")
        alert = "".join(alert_parts)
        send_telegram_alert(alert)
        print(alert)
        sys.exit(1)

    if gh_status == "failure":
        # Site is current but GH Actions failing — warn only
        warn = f"⚠️ *AI Repo Radar — GitHub Actions Failed*\n\n"
        warn += f"• Site is current: `{latest_date}` ✅\n"
        warn += f"• GitHub Actions: ❌ FAILED\n"
        warn += f"• [View failed run]({gh_url})\n"
        warn += f"\n_Note: Local backup deploy may have covered this. Check CF token in repo secrets._\n"
        send_telegram_alert(warn)
        print(warn)
        sys.exit(0)  # Not critical since site is current

    status = f"✅ AI Repo Radar — {latest_date} ({index[0].get('count', 0)} repos) | GH Actions: healthy"
    print(status)

if __name__ == "__main__":
    main()
