
# João Matos — portfolio

Personal site: [jpndmatos.github.io/Portfolio](https://jpndmatos.github.io/Portfolio/).

The selection links to independently maintained applications and complete source repositories. The portfolio does not run simulated versions of their backends.

| Project | Use it / source | What runs |
| --- | --- | --- |
| Touchline | [App](https://jpndmatos.github.io/touchline/) · [Source](https://github.com/jpndmatos/touchline) | React goal hub with an ASP.NET Core API on Railway |
| Split | [Source](https://github.com/jpndmatos/split) | React + Node.js + SQLite expense ledger |
| Overlap | [App](https://jpndmatos.github.io/overlap/) · [Source](https://github.com/jpndmatos/overlap) | Browser-native time zone planner |
| Image Desk | [App](https://jpndmatos.github.io/image-desk/) · [Source](https://github.com/jpndmatos/image-desk) | Local image processing and ZIP export |
| EatEasy | [Source](https://github.com/jpndmatos/EatEasy) | PHP sessions, customer/admin accounts, PostgreSQL or SQLite bookings |
| Relay | [Source](https://github.com/jpndmatos/relay) | ASP.NET Core, Identity, EF Core, SignalR and React incident workspace |

Split, EatEasy and Relay include local startup instructions in their own repositories. They need application servers; GitHub Pages cannot run those backends. Touchline's video availability depends on its providers.

## Local preview

```sh
python -m http.server 5181 --bind 127.0.0.1
```

Open http://127.0.0.1:5181/. There is no runtime package dependency or frontend build step.

## Publishing and checks

```sh
python scripts/build-site.py
```

The script validates local references and packages only public files into `.build/public`. GitHub Actions checks the responsive page and WCAG accessibility before uploading that directory to Pages. It excludes source archives, tooling, test output and project exports.

For browser checks, install development dependencies with `npm ci`, install Playwright Chromium with `npx playwright install chromium`, start the preview server, then run `npm run test:browser`. `PLAYWRIGHT_CHANNEL=chrome` uses installed Chrome instead. `PORTFOLIO_URL` selects a different preview origin.

Screenshots show the actual applications with example or public data. Project-specific behaviour, storage and deployment notes belong in each project's README.
