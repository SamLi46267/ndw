# Natural Disaster Alert System

[简体中文](README.md) · [Open the website](https://geowarning.cn/)

A static, mobile-friendly site for checking disaster reports and finding preparedness resources. The interface supports Chinese, English, Spanish, French, and Italian. Switch between light and dark themes on Main. The browser remembers your choice.

## What you can do

| Page | Features |
| --- | --- |
| Main | See an overview of China warnings and global earthquakes with an animated globe background. Open a summary card to view the related records. |
| China | Choose a province, city, or district. Tap a city dot on either China map to jump to that city's warnings. Use **Open larger map** for a bigger view. Warning details include affected areas, recommended actions, and the original notice when available. Secondary hazards are described qualitatively. |
| Global Hazards | Explore earthquakes and GDACS reports on the world map. Filter by hazard type or open **View all live disasters** for the searchable list. The map panel and list show GDACS reports in update order. Earthquake magnitudes use an amber-to-red scale. |
| U.S. weather alerts | Read National Weather Service bulletins by state or territory. Open a bulletin for the issuing office, dates, affected area, and original instructions when supplied. |
| Sources & coverage | Look up the coverage limits, collection schedule, source definitions, and official links for each feed. |
| Database and rescue contacts | Browse collected historical records and find relief organizations or official directories by country or region. |
| Guide, Tools, and Products | Read preparedness guides, use the first-aid cards, build a checklist or family plan, and try the interactive demos. |
| Settings | Change language, text size, contrast, motion, or browser reminders. |

## Where the data comes from

GitHub Actions collects the China, GDACS, and earthquake data. GitHub Pages serves the resulting snapshots. Normal browsing and local development require no API keys.

- **U.S. weather alerts:** The browser checks the NWS API on open and every 10 minutes while visible. When a direct request fails, GeoWarning shows the latest published NWS snapshot with its original collection time. The U.S. state map shows the highest reported severity for each state and lists bulletin counts using NWS zone codes. Snapshot collection runs on a 10-minute schedule, subject to GitHub Actions delays. [NWS API documentation](https://www.weather.gov/documentation/services-web-api)
- **China warnings:** WeatherCN, a data service authorized by the China Meteorological Administration. The provider reports at city level. District filtering uses place names in the official text. Broad city notices may apply to all districts. The scheduled collector rotates through 77 configured cities, normally four per 15-minute slot, with a rolling limit of 450 attempts in 24 hours. Separate weather readouts may use Open-Meteo.
- **Global hazards:** The live map and list check the official GDACS RSS and USGS earthquake feeds every three minutes while visible. **Update data** checks immediately. Published snapshots provide a fallback when either direct feed is unavailable. If a manual check still shows overdue data, **Request a published update** opens the GitHub collection request form.
- **Earthquake and GDACS snapshots:** Each collector is scheduled every five minutes, subject to GitHub Actions delays. Scheduled earthquake collection uses USGS. A manual earthquake workflow may use APIZERO when configured.
- **History and rescue contacts:** The archive contains records collected by this project. The rescue directory covers listed organizations and public contact resources. It does not provide dispatch or verify current availability.

**Refresh published data** reloads the latest published snapshot. On the China page and expanded map, **Update data** opens a GitHub issue form. Sign in and submit it to request a collection run, subject to shared limits. See the [collection and deployment guide](backend/README.md) for setup, quota rules, and GitHub Actions secrets.

## How to read stale or missing data

China map dots retain the original time and result of the last successful check. Green means no alerts at that check, yellow means alerts were found, and red means at least one red alert was found. A dashed ring marks a historical result, including when a China result is more than six hours old. Gray means there is no prior result.

When GDACS updates are overdue, dashed markers show last-reported locations whose current status is unconfirmed. Neither archived records nor an empty list can establish that an area is safe. Follow current instructions from local authorities and call your local emergency number in an emergency.

After visiting online, the safety guide can be read offline in the same browser. Browser reminders only check while the page is open and cannot replace official emergency notifications. The snapshot download counter in Settings records this browser's attempts, including failures.

## Run locally

Use Python 3 to serve the site over HTTP. From the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. The site uses the repository's published snapshots, which may be stale. No compilation or package install is needed.

Use Node.js 22 or newer to run the checks:

```sh
node --test backend/*.test.mjs
```

To exercise site preparation and generate the search catalog without changing tracked files, stage a copy and serve that instead:

```sh
site="$(mktemp -d)"
cp -R index.html CNAME favicon.svg sw.js manifest.webmanifest robots.txt sitemap.xml css js assets public-data "$site/"
ALLOW_STALE_DATA=1 node backend/prepare-site.mjs "$site"
python3 -m http.server 8000 --directory "$site"
```

## Repository layout

- `index.html`, `css/`, `js/`, and `assets/` contain the static site.
- `public-data/` contains published warnings, disaster records, and directory data.
- `backend/` contains collectors, tests, and site preparation scripts.
- `.github/workflows/` contains collection and GitHub Pages publishing workflows.
