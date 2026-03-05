# Photo Collections Feature Design

## Overview

Add photo upload and display capabilities to the missions kiosk. Church staff upload mission trip and event photos via the admin page (from their own devices). Photos are stored in the GitHub repo and deployed via Netlify.

## Storage: GitHub as Backend

Photos committed to `photos/` directory via GitHub Contents API. Netlify auto-deploys on push (~1 min delay). Low volume (1-5 photos every few months) keeps repo size manageable.

## Data Model

```
photos/                          # Uploaded photo files
data/photos.json                 # Photo manifest
```

### photos.json

```json
{
  "collections": [
    {
      "id": "guatemala-2026",
      "title": "Guatemala Mission Trip",
      "date": "2026-03-04",
      "mission": "Amigos en Cristo",
      "photos": [
        { "file": "2026-03-04-guatemala-trip-1.jpg", "caption": "" },
        { "file": "2026-03-04-guatemala-trip-2.jpg", "caption": "Building homes" }
      ]
    }
  ],
  "banner": {
    "collectionId": "guatemala-2026",
    "photoIndex": null
  }
}
```

- **collections** — groups of photos from a trip or event
- **mission** — optional link to a mission partner name (must match missions.json)
- **banner** — which collection to show in the rotating banner. `null` photoIndex = cycle all.

## Admin UI (admin.html)

New section below Featured Mission:

### 1. GitHub Token Setup
- One-time setup field (gear icon) for GitHub personal access token
- Stored in staff browser's localStorage only, never committed
- Requires `repo` scope

### 2. Create Collection
- Title (text input)
- Date (auto-filled to today)
- Mission partner (dropdown from missions.json + "None")
- File picker (multi-select images)
- Optional caption per photo (shown after file selection)
- "Upload" button commits photos + updates photos.json via GitHub API

### 3. Existing Collections
- Cards with title, date, mission link, thumbnail grid
- "Add Photos" and "Delete Collection" buttons
- Tap photo to edit caption or remove

### 4. Banner Settings
- Dropdown to select which collection shows as rotating banner (or "None")
- Updates photos.json AND localStorage for instant kiosk sync

## Kiosk Display — Three Modes

### 1. Rotating Featured Banner (index.html)
- Photo banner at bottom-right of globe screen
- Cycles photos from selected banner collection every 8-10 seconds with crossfade
- Shows collection title and caption overlay
- Tapping opens full gallery for that collection
- Stacks with or alternates with featured mission banner

### 2. Photo Gallery (gallery.html — new file)
- Accessible via "Photos" button on globe UI
- Grid of collection cards with cover thumbnails
- Tap collection → fullscreen slideshow with swipe/tap navigation
- Captions, title, date shown per photo
- Dark theme matching globe/screensaver
- "Back to Globe" button

### 3. Mission-Linked Photos (index.html)
- Mission preview card shows "Trip Photos" button when linked collections exist
- Opens gallery filtered to that mission's collections
- No change for missions without photos

## Technical Details

### Upload Flow
1. Admin selects files → browser reads as base64
2. Client-side resize to max ~1200px wide (canvas API)
3. PUT each photo via GitHub Contents API to `photos/{filename}`
4. Fetch current photos.json, update with new collection, commit
5. Write updated data to localStorage for instant kiosk sync

### Filename Convention
`{date}-{collection-slug}-{index}.jpg` (e.g., `2026-03-04-guatemala-1.jpg`)

### Sync Strategy
- localStorage for instant updates (same as featured mission pattern)
- photos.json as persistent source of truth
- Kiosk gracefully handles missing images (pre-deploy) with placeholder

### Image Handling
- Client-side resize before upload (canvas API, no dependencies)
- Max width ~1200px for kiosk display performance
- JPEG compression for file size

## Files Changed

| File | Change |
|------|--------|
| `admin.html` | Add photo management section |
| `index.html` | Add rotating banner, gallery link, mission-linked photos button |
| `gallery.html` | **New** — photo gallery page |
| `data/photos.json` | **New** — photo manifest |
| `photos/` | **New** — uploaded photo directory |

## No New Dependencies

Everything uses vanilla JS, GitHub REST API, and the canvas API.
