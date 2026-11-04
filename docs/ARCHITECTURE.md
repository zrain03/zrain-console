<!--
Fail / File: docs/ARCHITECTURE.md
Pembangun / Developer: Zrain
Dicipta / Created: 2026-11-01 (Git introduction 39e2683; import provenance noted separately)
Dikemas kini / Last updated: 2026-11-04
BM: Peta aliran Console dan sempadan antara snapshot serta host produksi.
EN: Console flow and boundaries between this source snapshot and the production host.
-->

# How Zrain Console works

Zrain Console is the **frontend viewing layer** inside the Zrain Ecosystem. Each featured product remains its own separate application.

## The live flow

    Zrain Ecosystem product cards
         |
         +-- Primary button has data-console="product-id"
              |
              +-- public/zrain-console.js checks known products
                   |
                   +-- HTML dialog + iframe
                   +-- Mobile or Desktop viewing mode
                   +-- Refresh, fullscreen, close
                   +-- Open original app in new tab

The published product directory comes from the existing Cloudflare Worker and KV storage; there is no extra Console backend.

## Design choices

1. **One viewer, original applications.** Games, services and developer showcases remain independently deployed.
2. **Small web stack.** Plain HTML, CSS, JavaScript, native dialog, iframe, and ResizeObserver.
3. **Known product IDs.** Deep-link demonstrations accept recognized built-in IDs, not arbitrary iframe URLs.
4. **Mobile and Desktop modes.** The 390-by-844 mobile virtual viewport fits to the available space. Desktop uses a wide CSS viewport scaled to fit.
5. **Preserve app state.** Changing views does not reload the existing iframe. Refresh explicitly reloads it.
6. **Zrain UI showcase exception.** Trusted local same-origin HTML is displayed via srcdoc to avoid a problematic secondary iframe navigation.
7. **Respect iframe restrictions.** Other apps may disallow embedding via their browser security headers. The fallback is Open in new tab.

## Source map

- src/zrain-console.js: snapshot of Ecosystem public/zrain-console.js
- src/console-products.js: snapshot of Ecosystem public/console-products.js
- src/zrain-console.css: extracted Console section from Ecosystem public/style.css

The full host dialog HTML, images, and regression tests remain in [zrain03/zrain-ecosystem](https://github.com/zrain03/zrain-ecosystem). These snapshots help review the real source but are not a drop-in standalone package. Their execution requires the host-provided dialog, iframe, DOM controls and catalog validation.

## Review findings / Penemuan audit

- **BM:** Produk built-in yang berada dalam snapshot lama berjumlah enam tetapi source produksi mempunyai sebelas. Katalog snapshot diselaraskan tanpa mengubah pengawal modal.
- **EN:** The previous snapshot listed six built-in products but production had eleven. The snapshot catalog was synchronized without modifying the modal controller.
- **BM:** `registerPublishedProducts` menerima data yang telah divalidasi oleh `public/product-catalog-client.js`, jadi ia bukan fungsi untuk menerima URL raw pengguna.
- **EN:** `registerPublishedProducts` accepts data already validated by `public/product-catalog-client.js`; it is not a raw user-URL acceptance function.
- **BM:** Header/footer rasmi dan ScrollSpy adalah milik host Ecosystem dan shared Zrain UI, bukan tanggungjawab dialog Console.
- **EN:** Official header/footer and ScrollSpy belong to the Ecosystem host and shared Zrain UI, not the Console dialog.
- **BM:** `src/zrain-console.css` tidak diubah dari segi peraturan CSS agar Golden Reference sedia ada tidak terganggu.
- **EN:** CSS rules in `src/zrain-console.css` remain unchanged to preserve the established Golden Reference.
