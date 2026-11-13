"""
FarmScale - Auto Sync to GitHub
Synchronizes all FarmScale repositories to GitHub (user: nmtaief).
"""
import os
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(r"f:\Nasa API")

REPOSITORIES = [
    {
        "name": "FarmScale Web App (Next.js)",
        "path": BASE_DIR / "farmscale-web",
        "url": "https://github.com/nmtaief/farmscale-web",
    },
    {
        "name": "FarmScale ML & NASA Gateway",
        "path": BASE_DIR / "FarmScale",
        "url": "https://github.com/nmtaief/FarmScale",
    },
    {
        "name": "FarmScale LLM Crops Data Layer",
        "path": BASE_DIR / "farmScale_llm-crops-data_layer",
        "url": "https://github.com/nmtaief/farmScale_llm-crops-data_layer",
    },
]

def run_git(repo_path: Path, args: list[str]) -> tuple[int, str]:
    res = subprocess.run(
        ["git", "-C", str(repo_path)] + args,
        capture_output=True,
        text=True,
        shell=True,
    )
    return res.returncode, (res.stdout + res.stderr).strip()

def sync_repo(repo: dict, commit_msg: str):
    p = repo["path"]
    name = repo["name"]
    print(f"\n==========================================")
    print(f"📦 Checking {name} ({p.name})")
    print(f"==========================================")
    if not p.is_dir() or not (p / ".git").is_dir():
        print(f"⚠️  Not a git repository: {p}")
        return

    # Check status
    _, status = run_git(p, ["status", "--porcelain"])
    if status:
        print(f"📝 Detected changes in {p.name}:")
        for line in status.splitlines()[:10]:
            print(f"   {line}")
        print("➕ Staging all changes...")
        run_git(p, ["add", "."])
        print(f"💾 Committing: {commit_msg}")
        run_git(p, ["commit", "-m", commit_msg])
    else:
        print("✅ Working tree clean (no new local changes).")

    # Push to origin (nmtaief)
    print("🚀 Pushing to origin main (https://github.com/nmtaief/{repo_name})...".format(repo_name=p.name))
    code, push_out = run_git(p, ["push", "origin", "main"])
    if code == 0:
        print(f"✅ Successfully pushed {p.name} to origin/main!")
    else:
        print(f"⚠️ Push output: {push_out}")

    # Also push to zaman if configured
    _, remotes = run_git(p, ["remote"])
    if "zaman" in remotes.split():
        print("🚀 Also pushing to secondary remote 'zaman'...")
        run_git(p, ["push", "zaman", "main"])

    # Show latest commit
    _, log_out = run_git(p, ["log", "-n", "1", "--oneline"])
    print(f"🔖 Current HEAD: {log_out}")
    print(f"🔗 Public Link: {repo['url']}")

def main():
    commit_msg = sys.argv[1] if len(sys.argv) > 1 else "feat: update farmscale project components and sync"
    print(f"🛰️  FarmScale GitHub Auto-Sync Tool")
    print(f"👤 GitHub User: nmtaief")
    print(f"💬 Commit message: \"{commit_msg}\"")

    for repo in REPOSITORIES:
        if repo["path"].exists():
            sync_repo(repo, commit_msg)

    print("\n🎉 All FarmScale repositories are synchronized to GitHub!")

if __name__ == "__main__":
    main()

