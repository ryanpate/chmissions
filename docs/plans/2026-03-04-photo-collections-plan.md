# Photo Collections Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add photo upload via admin page (using GitHub API) and three display modes on the kiosk: rotating banner, standalone gallery, and mission-linked photos.

**Architecture:** Photos are committed to a `photos/` directory in the GitHub repo via the Contents API. A `data/photos.json` manifest tracks collections, captions, mission links, and banner selection. localStorage provides instant sync to the kiosk (same pattern as featured mission), with the JSON file as persistent source of truth.

**Tech Stack:** Vanilla HTML/CSS/JS, GitHub REST API, Canvas API (for image resizing)

---

### Task 1: Create Initial Data Files

**Files:**
- Create: `data/photos.json`
- Create: `photos/.gitkeep`

**Step 1: Create the empty photos.json manifest**

Create `data/photos.json`:
```json
{
  "collections": [],
  "banner": {
    "collectionId": null,
    "photoIndex": null
  }
}
```

**Step 2: Create photos directory with .gitkeep**

```bash
mkdir -p photos
touch photos/.gitkeep
```

**Step 3: Commit**

```bash
git add data/photos.json photos/.gitkeep
git commit -m "feat: add initial photo collections data structure"
```

---

### Task 2: Admin — GitHub Token Setup

**Files:**
- Modify: `admin.html`

Add a GitHub settings section at the top of the admin page. This stores a personal access token in localStorage for API calls.

**Step 1: Add CSS styles for the settings section**

In `admin.html`, add these styles inside the existing `<style>` block, before the closing `</style>` tag:

```css
.settings-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.settings-toggle {
    background: none;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 8px 12px;
    cursor: pointer;
    font-family: 'Brandon Grotesque', sans-serif;
    color: #666;
    font-size: 14px;
}

.settings-toggle:hover {
    border-color: #4A90E2;
    color: #4A90E2;
}

.settings-panel {
    display: none;
    padding: 20px;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    margin-bottom: 20px;
}

.settings-panel.active {
    display: block;
}

.settings-panel label {
    display: block;
    font-weight: 600;
    margin-bottom: 5px;
    color: #333;
}

.settings-panel input[type="text"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-family: 'Brandon Grotesque', sans-serif;
    font-size: 14px;
    margin-bottom: 10px;
}

.settings-panel .hint {
    font-size: 12px;
    color: #666;
    margin-bottom: 10px;
}

.token-status {
    font-size: 13px;
    padding: 5px 10px;
    border-radius: 4px;
    display: inline-block;
}

.token-status.connected {
    background: #d4edda;
    color: #155724;
}

.token-status.missing {
    background: #f8d7da;
    color: #721c24;
}
```

**Step 2: Add settings HTML**

In `admin.html`, replace the opening of the container div:

Find:
```html
<div class="container">
    <h1>Missions Administration</h1>
```

Replace with:
```html
<div class="container">
    <div class="settings-bar">
        <h1>Missions Administration</h1>
        <button class="settings-toggle" id="settingsToggle">Settings</button>
    </div>

    <div class="settings-panel" id="settingsPanel">
        <label for="githubToken">GitHub Personal Access Token</label>
        <div class="hint">Required for photo uploads. Create at github.com/settings/tokens with "repo" scope. Token is stored locally in your browser only.</div>
        <input type="text" id="githubToken" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
        <button class="button" id="saveToken">Save Token</button>
        <span class="token-status" id="tokenStatus"></span>
    </div>
```

**Step 3: Add settings JavaScript**

In `admin.html`, add this code right after the `// Initialize` comment block (before `</script>`):

```javascript
// GitHub Token Management
const GITHUB_OWNER = 'ryanpate';
const GITHUB_REPO = 'chmissions';

document.getElementById('settingsToggle').addEventListener('click', () => {
    document.getElementById('settingsPanel').classList.toggle('active');
});

document.getElementById('saveToken').addEventListener('click', () => {
    const token = document.getElementById('githubToken').value.trim();
    if (token) {
        localStorage.setItem('githubToken', token);
        updateTokenStatus();
    }
});

function updateTokenStatus() {
    const token = localStorage.getItem('githubToken');
    const statusEl = document.getElementById('tokenStatus');
    if (token) {
        statusEl.textContent = 'Connected';
        statusEl.className = 'token-status connected';
    } else {
        statusEl.textContent = 'No token set';
        statusEl.className = 'token-status missing';
    }
}

updateTokenStatus();
```

**Step 4: Verify manually**

Open `admin.html` in a browser. Verify:
- Settings button appears top-right
- Clicking it reveals the token input panel
- Saving a token shows "Connected" status
- Refreshing the page retains the status

**Step 5: Commit**

```bash
git add admin.html
git commit -m "feat: add GitHub token settings to admin page"
```

---

### Task 3: Admin — Image Resize Utility

**Files:**
- Modify: `admin.html`

Add a utility function that resizes images client-side using the canvas API before uploading. This keeps repo size small and display performance fast.

**Step 1: Add the resize function**

In `admin.html`, add this inside the `<script>` block, after the GitHub token management code:

```javascript
// Image Resize Utility
function resizeImage(file, maxWidth = 1200) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64 JPEG
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Generate slug from text
function slugify(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
```

**Step 2: Commit**

```bash
git add admin.html
git commit -m "feat: add client-side image resize utility"
```

---

### Task 4: Admin — GitHub API Helper Functions

**Files:**
- Modify: `admin.html`

Add helper functions for interacting with the GitHub Contents API: reading files, creating/updating files, and reading the photos manifest.

**Step 1: Add GitHub API helpers**

In `admin.html`, add after the image resize utility code:

```javascript
// GitHub API Helpers
async function githubAPI(path, options = {}) {
    const token = localStorage.getItem('githubToken');
    if (!token) {
        throw new Error('GitHub token not set. Please configure in Settings.');
    }

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
}

// Upload a single file to the repo
async function uploadFileToGitHub(path, base64Content, message) {
    // Check if file already exists (to get its SHA for updates)
    let sha = null;
    try {
        const existing = await githubAPI(path);
        sha = existing.sha;
    } catch (e) {
        // File doesn't exist yet, that's fine
    }

    const body = {
        message: message,
        content: base64Content
    };
    if (sha) body.sha = sha;

    return githubAPI(path, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

// Load photos manifest from GitHub (or localStorage cache)
async function loadPhotosData() {
    // Try localStorage first for instant display
    const cached = localStorage.getItem('photosData');
    if (cached) {
        return JSON.parse(cached);
    }

    // Fall back to fetching the file
    try {
        const response = await fetch('data/photos.json');
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('photosData', JSON.stringify(data));
            return data;
        }
    } catch (e) {
        console.log('No photos data found');
    }

    return { collections: [], banner: { collectionId: null, photoIndex: null } };
}

// Save photos manifest to GitHub and localStorage
async function savePhotosData(photosData) {
    localStorage.setItem('photosData', JSON.stringify(photosData));

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(photosData, null, 2))));
    await uploadFileToGitHub('data/photos.json', content, 'update photo collections');
}
```

**Step 2: Commit**

```bash
git add admin.html
git commit -m "feat: add GitHub API helper functions for photo uploads"
```

---

### Task 5: Admin — Create Collection UI & Upload Flow

**Files:**
- Modify: `admin.html`

This is the main upload feature. Add the "Photo Collections" section to the admin page with a form to create collections and upload photos.

**Step 1: Add CSS for photo management section**

Add to the `<style>` block:

```css
.photo-form {
    display: grid;
    gap: 15px;
    margin-bottom: 20px;
}

.photo-form label {
    font-weight: 600;
    color: #333;
    display: block;
    margin-bottom: 5px;
}

.photo-form input[type="text"],
.photo-form input[type="date"],
.photo-form select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-family: 'Brandon Grotesque', sans-serif;
    font-size: 14px;
}

.photo-form input[type="file"] {
    padding: 10px;
}

.file-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    margin-top: 10px;
}

.file-preview-item {
    position: relative;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    background: #f9f9f9;
}

.file-preview-item img {
    width: 100%;
    height: 120px;
    object-fit: cover;
}

.file-preview-item input {
    width: 100%;
    padding: 5px;
    border: none;
    border-top: 1px solid #ddd;
    font-family: 'Brandon Grotesque', sans-serif;
    font-size: 12px;
}

.upload-progress {
    margin-top: 10px;
    display: none;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background: #4A90E2;
    border-radius: 4px;
    transition: width 0.3s ease;
    width: 0%;
}

.progress-text {
    font-size: 13px;
    color: #666;
    margin-top: 5px;
}

.collection-card {
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    margin-bottom: 15px;
}

.collection-card h4 {
    margin-bottom: 5px;
    color: #333;
}

.collection-card .meta {
    font-size: 12px;
    color: #666;
    margin-bottom: 10px;
}

.collection-card .photo-thumbs {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    margin-bottom: 10px;
}

.collection-card .photo-thumbs img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
}

.collection-actions {
    display: flex;
    gap: 10px;
}

.banner-select {
    margin-top: 15px;
}

.banner-select select {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-family: 'Brandon Grotesque', sans-serif;
    font-size: 14px;
    min-width: 250px;
}
```

**Step 2: Add Photo Collections HTML section**

In `admin.html`, add this new section after the existing Featured Mission `</div>` (the closing div of the section with class "section") and before the "Back to Map" link:

```html
<div class="section">
    <h2>Photo Collections</h2>

    <h3>Create New Collection</h3>
    <div class="photo-form" id="photoForm">
        <div>
            <label for="collectionTitle">Title</label>
            <input type="text" id="collectionTitle" placeholder="e.g., Guatemala Mission Trip 2026">
        </div>
        <div>
            <label for="collectionDate">Date</label>
            <input type="date" id="collectionDate">
        </div>
        <div>
            <label for="collectionMission">Link to Mission Partner (optional)</label>
            <select id="collectionMission">
                <option value="">None</option>
            </select>
        </div>
        <div>
            <label for="photoFiles">Photos</label>
            <input type="file" id="photoFiles" multiple accept="image/*">
            <div class="file-preview" id="filePreview"></div>
        </div>
        <div class="upload-progress" id="uploadProgress">
            <div class="progress-bar">
                <div class="progress-bar-fill" id="progressBarFill"></div>
            </div>
            <div class="progress-text" id="progressText">Uploading...</div>
        </div>
        <button class="button" id="uploadBtn" disabled>Upload Collection</button>
    </div>

    <h3>Existing Collections</h3>
    <div id="collectionsGrid"></div>

    <div class="banner-select">
        <h3>Photo Banner on Globe</h3>
        <p style="font-size: 13px; color: #666; margin-bottom: 10px;">Select a collection to rotate as a photo banner on the globe screen.</p>
        <select id="bannerSelect">
            <option value="">None (disabled)</option>
        </select>
    </div>
</div>
```

**Step 3: Add the collection management JavaScript**

Add after the GitHub API helpers in the `<script>` block:

```javascript
// Photo Collection Management
let photosData = { collections: [], banner: { collectionId: null, photoIndex: null } };
let selectedFiles = [];
let fileCaptions = [];

// Set default date to today
document.getElementById('collectionDate').valueAsDate = new Date();

// Populate mission partner dropdown
function populateMissionDropdown() {
    const select = document.getElementById('collectionMission');
    missions.forEach(m => {
        const option = document.createElement('option');
        option.value = m.name;
        option.textContent = m.name;
        select.appendChild(option);
    });
}

// File input change - show previews
document.getElementById('photoFiles').addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files);
    fileCaptions = selectedFiles.map(() => '');
    const preview = document.getElementById('filePreview');
    preview.innerHTML = '';

    selectedFiles.forEach((file, i) => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);

        const captionInput = document.createElement('input');
        captionInput.type = 'text';
        captionInput.placeholder = 'Caption (optional)';
        captionInput.addEventListener('input', (e) => {
            fileCaptions[i] = e.target.value;
        });

        item.appendChild(img);
        item.appendChild(captionInput);
        preview.appendChild(item);
    });

    document.getElementById('uploadBtn').disabled = selectedFiles.length === 0;
});

// Upload collection
document.getElementById('uploadBtn').addEventListener('click', async () => {
    const title = document.getElementById('collectionTitle').value.trim();
    const date = document.getElementById('collectionDate').value;
    const mission = document.getElementById('collectionMission').value;

    if (!title) { alert('Please enter a collection title.'); return; }
    if (selectedFiles.length === 0) { alert('Please select photos.'); return; }

    const token = localStorage.getItem('githubToken');
    if (!token) { alert('Please set your GitHub token in Settings first.'); return; }

    const uploadBtn = document.getElementById('uploadBtn');
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');

    uploadBtn.disabled = true;
    progressDiv.style.display = 'block';

    try {
        const slug = slugify(title);
        const collectionId = `${date}-${slug}`;
        const photos = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const filename = `${date}-${slug}-${i + 1}.jpg`;
            const progress = Math.round(((i) / selectedFiles.length) * 100);
            progressFill.style.width = progress + '%';
            progressText.textContent = `Resizing and uploading ${file.name} (${i + 1}/${selectedFiles.length})...`;

            const base64 = await resizeImage(file);
            await uploadFileToGitHub(`photos/${filename}`, base64, `add photo: ${filename}`);

            photos.push({ file: filename, caption: fileCaptions[i] || '' });
        }

        // Update manifest
        progressText.textContent = 'Updating photo manifest...';
        progressFill.style.width = '90%';

        photosData = await loadPhotosData();
        photosData.collections.push({
            id: collectionId,
            title: title,
            date: date,
            mission: mission || null,
            photos: photos
        });

        await savePhotosData(photosData);

        progressFill.style.width = '100%';
        progressText.textContent = 'Upload complete!';

        // Reset form
        setTimeout(() => {
            document.getElementById('collectionTitle').value = '';
            document.getElementById('collectionDate').valueAsDate = new Date();
            document.getElementById('collectionMission').value = '';
            document.getElementById('photoFiles').value = '';
            document.getElementById('filePreview').innerHTML = '';
            selectedFiles = [];
            fileCaptions = [];
            progressDiv.style.display = 'none';
            progressFill.style.width = '0%';
            uploadBtn.disabled = true;
            displayCollections();
            updateBannerDropdown();
        }, 2000);

    } catch (error) {
        progressText.textContent = `Error: ${error.message}`;
        progressFill.style.width = '0%';
        uploadBtn.disabled = false;
    }
});

// Display existing collections
function displayCollections() {
    const grid = document.getElementById('collectionsGrid');
    grid.innerHTML = '';

    if (photosData.collections.length === 0) {
        grid.innerHTML = '<p style="color: #666; font-style: italic;">No photo collections yet.</p>';
        return;
    }

    photosData.collections.forEach(collection => {
        const card = document.createElement('div');
        card.className = 'collection-card';

        const thumbsHtml = collection.photos.slice(0, 5).map(p =>
            `<img src="photos/${p.file}" alt="${p.caption}" onerror="this.style.background='#ddd'; this.alt='Pending deploy'">`
        ).join('');

        card.innerHTML = `
            <h4>${collection.title}</h4>
            <div class="meta">
                ${collection.date}${collection.mission ? ` &middot; ${collection.mission}` : ''}
                &middot; ${collection.photos.length} photo${collection.photos.length !== 1 ? 's' : ''}
            </div>
            <div class="photo-thumbs">${thumbsHtml}</div>
            <div class="collection-actions">
                <button class="button danger" onclick="deleteCollection('${collection.id}')">Delete</button>
            </div>
        `;

        grid.appendChild(card);
    });
}

// Delete a collection
async function deleteCollection(collectionId) {
    if (!confirm('Delete this collection? Photos will remain in the repository but will be unlinked.')) return;

    photosData.collections = photosData.collections.filter(c => c.id !== collectionId);

    if (photosData.banner.collectionId === collectionId) {
        photosData.banner.collectionId = null;
    }

    try {
        await savePhotosData(photosData);
        displayCollections();
        updateBannerDropdown();
    } catch (error) {
        alert('Error deleting collection: ' + error.message);
    }
}

// Banner selection
function updateBannerDropdown() {
    const select = document.getElementById('bannerSelect');
    const currentValue = photosData.banner.collectionId || '';
    select.innerHTML = '<option value="">None (disabled)</option>';

    photosData.collections.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.title;
        if (c.id === currentValue) option.selected = true;
        select.appendChild(option);
    });
}

document.getElementById('bannerSelect').addEventListener('change', async (e) => {
    photosData.banner.collectionId = e.target.value || null;
    try {
        await savePhotosData(photosData);
        const successMsg = document.getElementById('successMessage');
        successMsg.textContent = 'Banner setting updated!';
        successMsg.style.display = 'block';
        setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
    } catch (error) {
        alert('Error updating banner: ' + error.message);
    }
});

// Initialize photo collections
async function initPhotos() {
    photosData = await loadPhotosData();
    populateMissionDropdown();
    displayCollections();
    updateBannerDropdown();
}

initPhotos();
```

**Step 4: Verify manually**

Open `admin.html` in a browser. Verify:
- "Photo Collections" section appears below Featured Mission
- Form fields render correctly (title, date, mission dropdown, file picker)
- Selecting files shows image previews with caption inputs
- Upload button enables when files are selected
- Banner dropdown appears at bottom

**Step 5: Commit**

```bash
git add admin.html
git commit -m "feat: add photo collection creation and management UI"
```

---

### Task 6: Gallery Page

**Files:**
- Create: `gallery.html`

Create a standalone gallery page that displays photo collections in a dark theme matching the globe/screensaver.

**Step 1: Create gallery.html**

Create `gallery.html` with the full gallery implementation:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mission Photos - Cherry Hills</title>
    <link rel="icon" type="image/png" href="assets/favicon.png">
    <style>
        @font-face {
            font-family: 'Brandon Grotesque';
            src: url('assets/fonts/BrandonGrotesque-Regular.woff2') format('woff2'),
                 url('assets/fonts/BrandonGrotesque-Regular.woff') format('woff');
            font-weight: 400;
        }

        @font-face {
            font-family: 'Brandon Grotesque';
            src: url('assets/fonts/BrandonGrotesque-Bold.woff2') format('woff2'),
                 url('assets/fonts/BrandonGrotesque-Bold.woff') format('woff');
            font-weight: 600;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Brandon Grotesque', sans-serif;
            background: #1a1a2e;
            color: #fff;
            min-height: 100vh;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 30px;
            background: rgba(0,0,0,0.3);
        }

        .header h1 {
            font-size: 28px;
            font-weight: 600;
        }

        .back-btn {
            background: rgba(74, 144, 226, 0.3);
            color: #fff;
            border: 1px solid rgba(74, 144, 226, 0.5);
            padding: 10px 20px;
            border-radius: 8px;
            font-family: 'Brandon Grotesque', sans-serif;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .back-btn:hover {
            background: rgba(74, 144, 226, 0.5);
        }

        .collections-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            padding: 30px;
        }

        .gallery-card {
            background: rgba(255,255,255,0.08);
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .gallery-card:hover {
            transform: translateY(-4px);
            background: rgba(255,255,255,0.12);
            box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }

        .gallery-card .cover {
            width: 100%;
            height: 200px;
            object-fit: cover;
            background: rgba(255,255,255,0.05);
        }

        .gallery-card .info {
            padding: 15px;
        }

        .gallery-card .info h3 {
            font-size: 18px;
            margin-bottom: 5px;
        }

        .gallery-card .info .meta {
            font-size: 13px;
            color: rgba(255,255,255,0.6);
        }

        .empty-state {
            text-align: center;
            padding: 80px 20px;
            color: rgba(255,255,255,0.5);
        }

        .empty-state h2 {
            margin-bottom: 10px;
        }

        /* Slideshow Overlay */
        .slideshow {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 1000;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .slideshow.active {
            display: flex;
        }

        .slideshow-close {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: #fff;
            font-size: 24px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 1001;
        }

        .slideshow-image {
            max-width: 90vw;
            max-height: 75vh;
            object-fit: contain;
            border-radius: 8px;
            transition: opacity 0.5s ease;
        }

        .slideshow-caption {
            margin-top: 20px;
            text-align: center;
            max-width: 600px;
        }

        .slideshow-caption h3 {
            font-size: 22px;
            margin-bottom: 5px;
        }

        .slideshow-caption p {
            color: rgba(255,255,255,0.7);
            font-size: 16px;
        }

        .slideshow-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.2);
            border: none;
            color: #fff;
            font-size: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.3s;
        }

        .slideshow-nav:hover {
            background: rgba(255,255,255,0.3);
        }

        .slideshow-nav.prev {
            left: 20px;
        }

        .slideshow-nav.next {
            right: 20px;
        }

        .slideshow-counter {
            position: absolute;
            bottom: 20px;
            font-size: 14px;
            color: rgba(255,255,255,0.5);
        }

        /* Inactivity timer for kiosk */
        .inactivity-notice {
            display: none;
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(74, 144, 226, 0.9);
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Mission Photos</h1>
        <a href="index.html" class="back-btn">Back to Globe</a>
    </div>

    <div class="collections-grid" id="collectionsGrid"></div>

    <div class="empty-state" id="emptyState" style="display: none;">
        <h2>No Photo Collections Yet</h2>
        <p>Check back soon for mission trip photos!</p>
    </div>

    <div class="slideshow" id="slideshow">
        <button class="slideshow-close" id="slideshowClose">&times;</button>
        <button class="slideshow-nav prev" id="slideshowPrev">&lsaquo;</button>
        <button class="slideshow-nav next" id="slideshowNext">&rsaquo;</button>
        <img class="slideshow-image" id="slideshowImage" src="" alt="">
        <div class="slideshow-caption">
            <h3 id="slideshowTitle"></h3>
            <p id="slideshowCaption"></p>
        </div>
        <div class="slideshow-counter" id="slideshowCounter"></div>
    </div>

    <script>
        let photosData = { collections: [], banner: { collectionId: null, photoIndex: null } };
        let currentSlideshow = null;
        let currentSlideIndex = 0;

        // Load photos data from localStorage or JSON file
        async function loadPhotosData() {
            const cached = localStorage.getItem('photosData');
            if (cached) {
                return JSON.parse(cached);
            }
            try {
                const response = await fetch('data/photos.json');
                if (response.ok) return await response.json();
            } catch (e) {}
            return { collections: [], banner: { collectionId: null, photoIndex: null } };
        }

        // Filter collections by mission name (from URL param)
        function getFilterMission() {
            const params = new URLSearchParams(window.location.search);
            return params.get('mission');
        }

        // Display collections
        function displayCollections() {
            const grid = document.getElementById('collectionsGrid');
            const emptyState = document.getElementById('emptyState');
            const filterMission = getFilterMission();

            let collections = photosData.collections;
            if (filterMission) {
                collections = collections.filter(c => c.mission === filterMission);
                document.querySelector('.header h1').textContent = `Photos: ${filterMission}`;
            }

            if (collections.length === 0) {
                grid.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            grid.innerHTML = '';
            collections.forEach(collection => {
                const card = document.createElement('div');
                card.className = 'gallery-card';

                const coverSrc = collection.photos.length > 0
                    ? `photos/${collection.photos[0].file}`
                    : '';

                card.innerHTML = `
                    <img class="cover" src="${coverSrc}" alt="${collection.title}"
                         onerror="this.style.background='rgba(255,255,255,0.05)'; this.alt='Photo loading...'">
                    <div class="info">
                        <h3>${collection.title}</h3>
                        <div class="meta">
                            ${collection.date}${collection.mission ? ` &middot; ${collection.mission}` : ''}
                            &middot; ${collection.photos.length} photo${collection.photos.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                `;

                card.addEventListener('click', () => openSlideshow(collection));
                grid.appendChild(card);
            });
        }

        // Slideshow
        function openSlideshow(collection) {
            currentSlideshow = collection;
            currentSlideIndex = 0;
            document.getElementById('slideshow').classList.add('active');
            showSlide();
        }

        function closeSlideshow() {
            document.getElementById('slideshow').classList.remove('active');
            currentSlideshow = null;
        }

        function showSlide() {
            if (!currentSlideshow) return;
            const photo = currentSlideshow.photos[currentSlideIndex];
            const img = document.getElementById('slideshowImage');
            img.style.opacity = 0;
            img.src = `photos/${photo.file}`;
            img.onload = () => { img.style.opacity = 1; };
            document.getElementById('slideshowTitle').textContent = currentSlideshow.title;
            document.getElementById('slideshowCaption').textContent = photo.caption || '';
            document.getElementById('slideshowCounter').textContent =
                `${currentSlideIndex + 1} / ${currentSlideshow.photos.length}`;
        }

        function nextSlide() {
            if (!currentSlideshow) return;
            currentSlideIndex = (currentSlideIndex + 1) % currentSlideshow.photos.length;
            showSlide();
        }

        function prevSlide() {
            if (!currentSlideshow) return;
            currentSlideIndex = (currentSlideIndex - 1 + currentSlideshow.photos.length) % currentSlideshow.photos.length;
            showSlide();
        }

        document.getElementById('slideshowClose').addEventListener('click', closeSlideshow);
        document.getElementById('slideshowNext').addEventListener('click', nextSlide);
        document.getElementById('slideshowPrev').addEventListener('click', prevSlide);

        // Swipe support for touch
        let touchStartX = 0;
        document.getElementById('slideshow').addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        document.getElementById('slideshow').addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) nextSlide();
                else prevSlide();
            }
        });

        // Inactivity: return to globe after 10 minutes
        let galleryInactivityTimer;
        function resetGalleryInactivity() {
            clearTimeout(galleryInactivityTimer);
            galleryInactivityTimer = setTimeout(() => {
                window.location.href = 'index.html';
            }, 600000);
        }
        document.addEventListener('click', resetGalleryInactivity);
        document.addEventListener('touchstart', resetGalleryInactivity);
        resetGalleryInactivity();

        // Initialize
        loadPhotosData().then(data => {
            photosData = data;
            displayCollections();
        });
    </script>
</body>
</html>
```

**Step 2: Verify manually**

Open `gallery.html` in a browser. Verify:
- Dark themed page loads
- Shows "No Photo Collections Yet" empty state
- Header has "Back to Globe" link
- Slideshow overlay elements are present (hidden)

**Step 3: Commit**

```bash
git add gallery.html
git commit -m "feat: add photo gallery page with slideshow"
```

---

### Task 7: Globe — Rotating Photo Banner

**Files:**
- Modify: `index.html`

Add a rotating photo banner to the globe screen that cycles through photos from the selected banner collection.

**Step 1: Add CSS for the photo banner**

In `index.html`, add these styles inside the `<style>` block (before the closing `</style>` tag). Place near the existing `#featured-banner` styles:

```css
#photo-banner {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 350px;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    z-index: 50;
    display: none;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    transition: transform 0.3s ease;
}

#photo-banner:hover {
    transform: scale(1.02);
}

#photo-banner:active {
    transform: scale(0.98);
}

#photo-banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
    transition: opacity 1s ease;
}

#photo-banner .banner-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 10px 15px;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    z-index: 2;
}

#photo-banner .banner-title {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
}

#photo-banner .banner-caption {
    font-size: 12px;
    color: rgba(255,255,255,0.7);
    margin-top: 2px;
}

#photos-button {
    position: fixed;
    bottom: 20px;
    left: 120px;
    background: rgba(0,0,0,0.6);
    color: white;
    border: 1px solid rgba(255,255,255,0.2);
    padding: 10px 15px;
    border-radius: 8px;
    font-family: 'Brandon Grotesque', sans-serif;
    font-size: 14px;
    cursor: pointer;
    z-index: 100;
    display: none;
    transition: all 0.3s ease;
}

#photos-button:hover {
    background: rgba(74, 144, 226, 0.6);
}
```

**Step 2: Add the photo banner and photos button HTML**

In `index.html`, add after the `<div id="featured-banner">` closing `</div>` (around line 702):

```html
<!-- Photo Banner -->
<div id="photo-banner">
    <img id="photo-banner-img-1" src="" alt="">
    <img id="photo-banner-img-2" src="" alt="" style="opacity: 0;">
    <div class="banner-overlay">
        <div class="banner-title" id="photo-banner-title"></div>
        <div class="banner-caption" id="photo-banner-caption"></div>
    </div>
</div>

<!-- Photos Gallery Button -->
<button id="photos-button">Photos</button>
```

**Step 3: Add the photo banner JavaScript**

In `index.html`, inside the `initializeGlobe()` function, add this code after the screensaver timer initialization (after `resetScreensaverTimer();` around line 1495):

```javascript
// Photo Banner
let bannerPhotos = [];
let bannerIndex = 0;
let bannerInterval = null;
let bannerActiveImg = 1; // toggles between 1 and 2 for crossfade

async function loadPhotoBanner() {
    let photosData;
    const cached = localStorage.getItem('photosData');
    if (cached) {
        photosData = JSON.parse(cached);
    } else {
        try {
            const response = await fetch('data/photos.json');
            if (response.ok) photosData = await response.json();
        } catch (e) {}
    }

    if (!photosData) return;

    // Show photos button if any collections exist
    if (photosData.collections.length > 0) {
        document.getElementById('photos-button').style.display = 'block';
    }

    // Load banner if set
    if (photosData.banner && photosData.banner.collectionId) {
        const collection = photosData.collections.find(c => c.id === photosData.banner.collectionId);
        if (collection && collection.photos.length > 0) {
            bannerPhotos = collection.photos;
            const bannerEl = document.getElementById('photo-banner');
            const titleEl = document.getElementById('photo-banner-title');

            bannerEl.style.display = 'block';
            titleEl.textContent = collection.title;

            // If featured banner is also showing, move photo banner up
            if (featuredMission) {
                bannerEl.style.bottom = '80px';
            }

            // Show first photo
            showBannerPhoto(0);

            // Cycle every 8 seconds if multiple photos
            if (bannerPhotos.length > 1) {
                bannerInterval = setInterval(() => {
                    bannerIndex = (bannerIndex + 1) % bannerPhotos.length;
                    showBannerPhoto(bannerIndex);
                }, 8000);
            }

            // Click banner to open gallery
            bannerEl.addEventListener('click', () => {
                window.location.href = 'gallery.html';
            });
        }
    }
}

function showBannerPhoto(index) {
    const photo = bannerPhotos[index];
    const img1 = document.getElementById('photo-banner-img-1');
    const img2 = document.getElementById('photo-banner-img-2');
    const captionEl = document.getElementById('photo-banner-caption');

    captionEl.textContent = photo.caption || '';

    // Crossfade between two img elements
    if (bannerActiveImg === 1) {
        img2.src = `photos/${photo.file}`;
        img2.onload = () => {
            img2.style.opacity = 1;
            img1.style.opacity = 0;
            bannerActiveImg = 2;
        };
    } else {
        img1.src = `photos/${photo.file}`;
        img1.onload = () => {
            img1.style.opacity = 1;
            img2.style.opacity = 0;
            bannerActiveImg = 1;
        };
    }
}

// Photos button click
document.getElementById('photos-button').addEventListener('click', () => {
    window.location.href = 'gallery.html';
});

loadPhotoBanner();
```

**Step 4: Verify manually**

With no banner set, the photo banner should be hidden. The "Photos" button should appear only if collections exist in localStorage/photos.json.

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add rotating photo banner and gallery button to globe"
```

---

### Task 8: Globe — Mission-Linked Photos

**Files:**
- Modify: `index.html`

Add a "Trip Photos" button to the mission preview card when a mission has linked photo collections.

**Step 1: Add CSS for the trip photos button**

In `index.html`, add inside the `<style>` block:

```css
#mission-preview .preview-photos-btn {
    background: rgba(74, 144, 226, 0.2);
    color: #4A90E2;
    border: 1px solid #4A90E2;
    padding: 8px 16px;
    border-radius: 5px;
    font-family: 'Brandon Grotesque', sans-serif;
    font-size: 13px;
    cursor: pointer;
    margin-top: 8px;
    width: 100%;
    transition: all 0.3s ease;
}

#mission-preview .preview-photos-btn:hover {
    background: rgba(74, 144, 226, 0.3);
}
```

**Step 2: Add the button HTML to the preview card**

In `index.html`, find the preview card HTML. After the `<button class="preview-cta"` line (line ~693), add:

```html
<button class="preview-photos-btn" id="preview-photos-btn" style="display: none;">Trip Photos</button>
```

So the preview card's content section becomes:
```html
<button class="preview-cta" id="preview-cta">View Info</button>
<button class="preview-photos-btn" id="preview-photos-btn" style="display: none;">Trip Photos</button>
<div class="preview-hint">Tap elsewhere to close</div>
```

**Step 3: Update showPreviewCard function**

In `index.html`, inside the `showPreviewCard` function, add this code after the QR code update (after the `qrImg.src = ...` line, around line 1131):

```javascript
// Check for linked photo collections
const photosBtn = document.getElementById('preview-photos-btn');
let photosDataForPreview;
const cachedPhotos = localStorage.getItem('photosData');
if (cachedPhotos) {
    photosDataForPreview = JSON.parse(cachedPhotos);
}
if (photosDataForPreview && photosDataForPreview.collections.some(c => c.mission === mission.name)) {
    photosBtn.style.display = 'block';
    photosBtn.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `gallery.html?mission=${encodeURIComponent(mission.name)}`;
    };
} else {
    photosBtn.style.display = 'none';
}
```

**Step 4: Verify manually**

When clicking a mission pin that has a linked collection, the preview card should show a "Trip Photos" button below "View Info". Clicking it navigates to the gallery filtered by that mission.

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add trip photos button to mission preview card"
```

---

### Task 9: Final Integration & Testing

**Files:**
- Review: `admin.html`, `index.html`, `gallery.html`, `data/photos.json`

**Step 1: End-to-end test**

Test the full flow:
1. Open `admin.html`, set a GitHub token in Settings
2. Create a collection with a title, date, mission link, and 2-3 photos
3. Verify upload progress works and photos commit to GitHub
4. Verify collection appears in "Existing Collections" list
5. Set the collection as the banner
6. Open `index.html` — verify the photo banner appears and cycles
7. Click the "Photos" button — verify gallery opens
8. Click a mission pin with linked photos — verify "Trip Photos" button appears
9. Click "Trip Photos" — verify gallery filters to that mission
10. Test slideshow: navigate with arrows and swipe
11. Test inactivity: wait or set short timer — verify gallery returns to globe

**Step 2: Test edge cases**

- No token set: upload shows clear error message
- No collections: gallery shows empty state, no banner, no Photos button
- Deleted collection that was banner: banner clears automatically
- Photo not yet deployed (pre-Netlify): thumbnail shows graceful fallback

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: photo collections - upload, gallery, banner, and mission-linked display"
```

---

## File Summary

| File | Action | Task |
|------|--------|------|
| `data/photos.json` | Create | Task 1 |
| `photos/.gitkeep` | Create | Task 1 |
| `admin.html` | Modify | Tasks 2, 3, 4, 5 |
| `gallery.html` | Create | Task 6 |
| `index.html` | Modify | Tasks 7, 8 |
