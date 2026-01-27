# Cherry Hills Missions Kiosk

## Overview

Interactive touchscreen kiosk application for Cherry Hills Church (Springfield, IL) that displays mission partners on a 3D globe. Runs on a Windows 11 mini PC in kiosk mode that reboots daily.

**Live Site:** Hosted on Netlify (auto-deploys from main branch)
**Repository:** https://github.com/ryanpate/chmissions

## Tech Stack

- **3D Globe:** Cesium.js 1.95
- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework)
- **Data:** Static JSON + pre-scraped HTML pages
- **Scraping:** Puppeteer (Node.js)
- **Hosting:** Netlify (static files, no build step)

## Project Structure

```
CHMissions/
├── index.html              # Main 3D globe application
├── screensaver.html        # Kiosk idle state
├── data/
│   ├── missions.json       # Mission data with coordinates
│   └── featured.json       # Currently featured mission
├── pages/                  # Scraped mission detail pages
├── assets/                 # Logos, fonts, pin icons
├── scraper/
│   └── scrape-pages.js     # Puppeteer content scraper
└── .github/workflows/
    └── sync-missions.yml   # Daily auto-sync workflow
```

## Adding a New Mission Partner

1. Add entry to `data/missions.json`:
```json
{
  "name": "Partner Name",
  "lat": 0.0,
  "lng": 0.0,
  "url": "https://cherryhillsfamily.org/missions/TYPE/profile/SLUG",
  "localFile": "partner-name.html",
  "type": "local|regional|global"
}
```

2. Run the scraper to fetch page content:
```bash
node scraper/scrape-pages.js
```

3. Commit and push to deploy:
```bash
git add .
git commit -m "added [Partner Name] mission partner"
git push
```

## Mission Types

- **local:** Springfield, IL area (pin: logo_local.png)
- **regional:** Illinois region (pin: logo_regional.png)
- **global:** International (pin: logo_global.png)

## Kiosk Behaviors

- **10 min inactivity:** Returns to home/featured mission view
- **30 min inactivity:** Shows screensaver
- **12-hour interval:** Auto-refreshes for content updates
- **Daily reboot:** Windows mini PC reboots to ensure fresh state

## Featured Mission

To set or change the featured mission, edit `data/featured.json`:
```json
{
  "name": "Mission Partner Name"
}
```

The name must exactly match a name in `missions.json`. The featured mission:
- Gets a gold pulsing pin on the globe
- Shows a clickable banner on the right side of the screen
- Becomes the default home view after inactivity

To remove the featured mission, set the name to empty string or delete the file.

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main application |
| `data/missions.json` | Mission coordinates and metadata |
| `data/featured.json` | Currently featured mission name |
| `scraper/scrape-pages.js` | Puppeteer script for content updates |
| `pages/*.html` | Pre-scraped mission content (offline-capable) |

## Cesium Configuration

- Uses Cesium Ion for imagery (requires token in index.html)
- Night lights layer: Asset ID 3812
- Camera constraints: 10km - 30,000km altitude
- Zoom distances vary by mission type (local: 50km, regional: 300km, global: 1000km)

## Automated Content Sync

GitHub Actions automatically syncs mission content daily:

- **Schedule:** Runs at 3 AM Central Time (9 AM UTC)
- **Process:** Scrapes all mission pages from Cherry Hills website
- **Auto-commit:** Only commits if content has changed
- **Trigger:** Can also be run manually from GitHub Actions tab

### Manual Trigger
1. Go to repository on GitHub
2. Click "Actions" tab
3. Select "Sync Mission Content"
4. Click "Run workflow"

### Workflow Location
`.github/workflows/sync-missions.yml`

## Dependencies

```bash
npm install  # Installs puppeteer and fs-extra for scraping
```

Only needed for running the scraper. The site itself has no build dependencies.
