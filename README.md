# Manifest Generator

A web-based tool that generates `local_manifest.xml` files for Android ROM building.  
It simplifies adding device, vendor, kernel, and other repositories needed when building custom ROMs.

## What is a `local_manifest.xml`?

When building Android ROMs, the main manifest defines the default repositories to sync.  
A `local_manifest.xml` lets you:

- Add custom repositories (device trees, vendor blobs, kernels)  
- Remove unwanted or conflicting repositories  
- Include device-specific dependencies  

Place this file in `.repo/local_manifests/`. It merges automatically during `repo sync`.

## How to Use

### 1. Add Remotes
Define the Git remotes for your repositories. Each remote needs:  

- **Name**: a short identifier (e.g., `remote1`)  
- **Fetch URL**: base URL (e.g., `https://github.com/username`)  

**Example:**

`Name: remote1`  
`Fetch URL: https://github.com/username`

### 2. Add Projects
Add repositories required for your build. Each project needs:  

- **Path**: clone location (e.g., `device/xiaomi/apollo`)  
- **Name**: repo name (e.g., `android_device_xiaomi_apollo`)  
- **Remote**: must match a defined remote name
- **Branch**: branch to sync (e.g., `main`)  

**Example:**

`Path: device/xiaomi/apollo`  
`Name: android_device_xiaomi_apollo`  
`Remote: remote1`  
`Branch: main`

### 3. Remove Projects (Optional)
Remove unwanted or conflicting repositories by specifying their paths.  

**Example:**

`Project path: hardware/xiaomi`

### 4. Verify & Generate
1. Review the generated manifest in the preview panel  
2. Use **Copy** or **Download** to get your `local_manifest.xml`

### 5. Test Your Manifest (Optional)
Validate your manifest against a ROM manifest:  

- Enter the ROM URL (e.g., `https://github.com/LineageOS/android.git`)  
- Enter the ROM branch (e.g., `lineage-21.0`)  
- Edit or paste your manifest content in the text area
- Click **Test Manifest** to run validation via GitHub Actions

**What the test validates:**

- XML syntax and compatibility with the ROM manifest  
- Repository URL accessibility  
- Branch/revision existence in each repository
