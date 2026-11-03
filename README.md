# João Matos’s portfolio

Static portfolio with four independently built, interactive project demos:

| Project | Standalone source | Portfolio demo |
| --- | --- | --- |
| Relay | `../relay` (.NET 10, React, SQLite, SignalR) | `demo/relay/` |
| Split | `../split` (React, Node.js, SQLite) | `demo/split/` |
| Image Desk | `../image-desk` (React, Canvas, local image exports) | `demo/image-desk/` |
| Overlap | `../overlap` (React, Intl, time-zone scheduling) | `demo/overlap/` |

Each project has its own dependencies, tests and build. The portfolio contains generated demo assets, not application source. Relay’s complete standalone source is also available as `assets/downloads/relay-source.zip`.

## Refresh demos

Install each standalone project’s dependencies first (`npm ci`, in Relay’s `web` folder). Run `./scripts/build-projects.ps1` from PowerShell; Node and Python are required. This rebuilds each app and exports its assets into `demo/`. Relay and Split demos use labelled fictional browser data; their production builds still use their real APIs. Image Desk processes files locally. Overlap stores preferences locally.

Preview the portfolio with `python -m http.server 5181`. GitHub Pages serves the checked-in static files, so the deployment needs no sibling repositories. Rebuild and export after changing a standalone app.

## Check the interface

With the static server running, use Relay’s installed browser-test dependencies:

```sh
node scripts/verify-portfolio.mjs
node scripts/verify-projects.mjs
```

The first check covers keyboard-accessible markup, local fonts and the portrait fallback. The second exercises expenses, image exports and meeting times on desktop and mobile, including archive-loading failures. Set `SPLIT_API_URL` to a disposable Split server to include the pending-save dialog check. `node scripts/verify-published.mjs` checks the live Pages routes after a deployment.
