<!--
Fail / File: README.md
Pembangun / Developer: Zrain
Dicipta / Created: 2026-11-01 (Git introduction 39e2683; import provenance noted separately)
Dikemas kini / Last updated: 2026-11-04
BM: Panduan Console snapshot, kontrak integrasi dan langkah ujian yang tidak memerlukan backend tambahan.
EN: Console snapshot guide, integration contracts and tests requiring no additional backend.
-->

# Zrain Console

**Explore apps without leaving the ecosystem.**

Zrain Console is the responsive viewing experience used across the [Zrain Ecosystem](https://zrain.web.app). Visitors can preview official games and web apps while each product keeps its own independent website, authentication, and backend.

**Developed by Zrain**  
*Made for people. Built with purpose.*

## Live demo

- [Explore the Zrain Console project page](https://zrain.web.app/zrain-console.html)
- [Play Guess The Flag](https://zrain.web.app/?console=guess-the-flag)
- [Open Zrain Links](https://zrain.web.app/?console=zrain-links)
- [View Zrain UI Showcase](https://zrain.web.app/?console=zrain-ui)

Each demo launches the actual Zrain Console in the Ecosystem. There is no duplicate demo app.

## Features

- Mobile and Desktop viewport switching without resetting the app
- Reload, fullscreen, close, and Open in new tab
- Google Play badge for supported games
- Accessible native HTML dialog and focus restoration
- 11 known built-in products, plus the host-validated published product catalog
- Local same-origin preview for Zrain UI Showcase
- No shared accounts or additional backend

## Repository files

| File | What it contains |
| --- | --- |
| src/zrain-console.js | Production Console controller snapshot |
| src/console-products.js | Built-in product definitions |
| src/zrain-console.css | Console-specific styles extracted from the Ecosystem |
| docs/ARCHITECTURE.md | Explanation of the implementation and limits |
| docs/PERSONA_AUDIT.md | Evidence-based audit, open risks and sync boundaries |
| FILE_PROVENANCE.json | File-level date, author and format-specific evidence |
| test/console.test.mjs | Behavior and source contract regression checks |
| scripts/check-persona.mjs | Zero-dependency metadata and inventory check |

The maintained production implementation is in [zrain03/zrain-ecosystem](https://github.com/zrain03/zrain-ecosystem). **This repository is not deployed independently.** The source files here are an **exported snapshot** of that working feature. They depend on the host HTML and assets and are not advertised as a standalone npm package.

## Integration example

An Ecosystem product card uses a known product ID such as:

    <button type="button" data-console="memory-rush">Play Now</button>

The Console resolves the ID to a trusted product and opens its existing web app in an iframe. Deep links such as https://zrain.web.app/?console=zrain-links accept only known built-in product IDs, never arbitrary website URLs.

## Use and limitations

The public demo runs on Zrain Ecosystem, so no installation is needed. For the full runnable website and release tests, see [the Ecosystem source](https://github.com/zrain03/zrain-ecosystem).

Some apps or identity providers forbid iframe embedding. Zrain Console respects their security policies and provides **Open in new tab**. It never bypasses an app's login or merges its data.

## Contact

[zrain.dev@gmail.com](mailto:zrain.dev@gmail.com)

## Local testing (Windows PowerShell / cross-platform)

The snapshot uses Node.js 22+ for tests only. There are no npm runtime dependencies and no paid APIs.

```powershell
cd "$env:USERPROFILE\Downloads\Zrain\Projects\zrain-console"
npm test
```

`npm test` runs functional tests and the Zrain Persona inventory audit. It does not run the live site or replace testing of the actual host at https://zrain.web.app.

## Source of truth and safe updates

- `src/zrain-console.js` corresponds to Ecosystem `public/zrain-console.js`; its **executable behavior** remains unchanged.
- `src/console-products.js` mirrors all **11 known product IDs** from the Ecosystem production catalog as checked on 2026-11-04.
- `src/zrain-console.css` is the extracted Console portion of Ecosystem `public/style.css`.
- To change real website behavior, modify and test the **Zrain Ecosystem** repository; updates to this exported snapshot alone do not deploy.
- This audit deliberately does not add a redundant Console hosting service, auth provider or database.

## Scope and security limits

The Console must receive **normalized, published catalog records** from the host (`public/product-catalog-client.js` validates HTTPS URLs, slugs and accepted actions). Query-string `?console=` accepts built-in product IDs only. Remote sites may refuse iframe embedding; the Console offers Open in new tab and does not bypass target authentication or security policies.

## Review and handoff

See [Persona audit](docs/PERSONA_AUDIT.md) for recorded evidence, exclusions, integration risks and acceptance checks.
