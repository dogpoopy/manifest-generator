#!/usr/bin/env python3

from lxml import etree
import subprocess
import sys
from pathlib import Path

manifest_file = Path(".repo/local_manifests/local_manifest.xml")

def normalize_fetch_url(fetch):
    if not fetch:
        return ""
    
    if not fetch.startswith("http://") and not fetch.startswith("https://"):
        fetch = f"https://{fetch}"
    
    if not fetch.endswith("/"):
        fetch += "/"
    
    return fetch

def get_repo_url(name, remote_fetch):
    name = name.strip("/")
    repo_url = f"{remote_fetch}{name}"
    
    if not repo_url.endswith(".git"):
        repo_url += ".git"
    
    return repo_url

def check_repo_accessible(repo_url, revision=None):
    try:
        if revision:
            cmd = ["git", "ls-remote", "--exit-code", repo_url, revision]
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                return False, "Repository not accessible or revision not found"
            
            if not result.stdout.strip():
                return False, f"Revision '{revision}' does not exist"
            
            return True, "OK"
        else:
            cmd = ["git", "ls-remote", "--exit-code", repo_url, "HEAD"]
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                return False, "Repository not accessible"
            
            return True, "OK"
            
    except subprocess.TimeoutExpired:
        return False, "Timeout - repository took too long to respond"
    except Exception as e:
        return False, str(e)

print("=" * 60)
print("VERIFYING MANIFEST REPOSITORIES")
print("=" * 60)

tree = etree.parse(str(manifest_file))
root = tree.getroot()

remotes = {}
for remote in root.findall("remote"):
    name = remote.attrib.get("name")
    fetch = remote.attrib.get("fetch")
    if name and fetch:
        remotes[name] = normalize_fetch_url(fetch)
        print(f"📍 Remote '{name}': {remotes[name]}")

if not remotes:
    print("⚠️  No remotes defined in manifest")

print()

projects = root.findall("project")
print(f"Found {len(projects)} project(s) to verify\n")

success_count = 0
fail_count = 0
failed_repos = []

for i, project in enumerate(projects, 1):
    name = project.attrib.get("name")
    if not name:
        continue
    
    path = project.attrib.get("path", name)
    revision = project.attrib.get("revision")
    remote_name = project.attrib.get("remote")
    
    print(f"[{i}/{len(projects)}] 🔍 Checking: {name}")
    print(f"     Path: {path}")
    print(f"     Remote: {remote_name}")
    if revision:
        print(f"     Revision: {revision}")
    
    if not remote_name:
        print(f"     ❌ No remote specified and no default remote found")
        fail_count += 1
        failed_repos.append(f"{name} - No remote specified")
        print()
        continue
    
    remote_fetch = remotes.get(remote_name)
    
    if not remote_fetch:
        print(f"     ❌ Unknown remote: {remote_name}")
        fail_count += 1
        failed_repos.append(f"{name} - Unknown remote: {remote_name}")
        print()
        continue
    
    repo_url = get_repo_url(name, remote_fetch)
    print(f"     URL: {repo_url}")
    
    accessible, message = check_repo_accessible(repo_url, revision)
    
    if accessible:
        print(f"     ✅ Accessible")
        success_count += 1
    else:
        print(f"     ❌ Failed: {message}")
        fail_count += 1
        failed_repos.append(f"{name} - {message}")
    
    print()

print("=" * 60)
print("VERIFICATION SUMMARY")
print("=" * 60)
print(f"✅ Accessible: {success_count}")
print(f"❌ Failed: {fail_count}")
print()

if fail_count > 0:
    print("FAILED REPOSITORIES:")
    for repo in failed_repos:
        print(f"  • {repo}")
    print()
    print("⚠️  Please check the repository URLs and revisions above")
    sys.exit(1)
else:
    print("🎉 All repositories are accessible and revisions exist!")
