/*
 * Fail / File: src/zrain-console.js
 * Pembangun / Developer: Zrain
 * Dicipta / Created: 2026-11-01 (Git introduction 39e2683; import provenance noted separately)
 * Dikemas kini / Last updated: 2026-11-04
 * BM: Pengawal dialog iframe Zrain dalam Ecosystem; kod runtime sama dengan snapshot produksi yang disahkan.
 * EN: Zrain iframe dialog controller inside Ecosystem; runtime logic matches the verified production snapshot.
 */
import { PRODUCTS } from "./console-products.js?v=4.1.6";

const published = new Map();
// BM: Gantikan peta produk terbitan berdasarkan katalog yang SUDAH dinormalisasi oleh host; inputnya bukan URL pengguna mentah.
// EN: Replace the published-product map using the host-validated catalog; input must not be raw user-provided URLs.
export function registerPublishedProducts(products) {
  published.clear();
  for (const item of products) {
    const builtIn = PRODUCTS[item.slug];
    const sourceFirst = ["GITHUB","PLAY_STORE","DOCUMENTATION"].includes(item.primaryAction);
    // The UI design-system preview is always the actual local showcase.
    const webUrl = item.slug === "zrain-ui" ? PRODUCTS["zrain-ui"].webUrl :
      sourceFirst && builtIn ? builtIn.webUrl : item.primaryUrl;
    published.set(item.slug, {
      name: item.name, description: item.description, icon: item.logoUrl,
      webUrl,
      storeUrl: item.secondaryUrl?.includes("play.google.com/store/apps/") ?
        item.secondaryUrl : builtIn?.storeUrl
    });
  }
}

// BM: Host wajib menyediakan elemen dialog dan kawalannya; jangan cipta host pendua di library snapshot.
// EN: The host must provide the dialog and its controls; this snapshot must not duplicate host markup.
const dialog = document.getElementById("zrain-console");
const stage = document.getElementById("console-stage");
const viewer = document.getElementById("console-viewer");
const frame = document.getElementById("console-frame");
const icon = document.getElementById("console-icon");
const name = document.getElementById("console-title");
const description = document.getElementById("console-description");
const modeLabel = document.getElementById("console-mode");
const external = document.getElementById("console-external");
const store = document.getElementById("console-store");
const reload = document.getElementById("console-reload");
const fullscreen = document.getElementById("console-fullscreen");
const close = document.getElementById("console-close");
const shell = document.getElementById("console-shell");
const mobileButton = document.getElementById("console-mobile");
const desktopButton = document.getElementById("console-desktop");

// Every web app starts with a responsive mobile viewport, including websites.
// The iframe presentation scales to fit the stage without resizing the browser.
// Remote web apps still own their content and sign-in behavior.
const PHONE = Object.freeze({ width: 390, height: 844 });
let current = null;
let opener = null;
let viewMode = "mobile";
let frameVersion = 0;

// BM: Kosongkan src dan srcdoc serta tingkatkan versi untuk membatalkan hasil fetch async yang lapuk.
// EN: Clear src and srcdoc and increment a version token to invalidate stale asynchronous fetch results.
function clearFrame() {
  frameVersion++;
  frame.removeAttribute("src");
  frame.removeAttribute("srcdoc");
}

// BM: Kira skala pratonton telefon; terima saiz container dan pulangkan saiz visual tanpa menukar ukuran dokumen aplikasi.
// EN: Calculate phone preview scaling from stage bounds and return visual dimensions without changing the app document viewport.
export function fitPortrait(bounds, logical = PHONE) {
  const w = Math.max(1, Number(bounds.width) || 1);
  const h = Math.max(1, Number(bounds.height) || 1);
  const scale = Math.min(w / logical.width, h / logical.height, 1.25);
  return {
    scale,
    width: Math.max(1, Math.floor(logical.width * scale)),
    height: Math.max(1, Math.floor(logical.height * scale))
  };
}

// BM: Susun iframe mengikut mod aktif; desktop mengekalkan breakpoint lebar dan mobile menggunakan viewport logik 390x844.
// EN: Lay out the frame for the current mode; desktop preserves wide breakpoints while mobile uses a logical 390x844 viewport.
function layoutFrame() {
  if (!current) return;
  if (viewMode === "desktop") {
    // Preserve true desktop responsive breakpoints even on a narrow phone.
    // Widen the iframe viewport, then scale its presentation to the stage.
    const availableWidth = Math.max(1, stage.clientWidth - 16);
    const availableHeight = Math.max(1, stage.clientHeight - 16);
    const logicalWidth = Math.max(1100, availableWidth);
    const scale = Math.min(availableWidth / logicalWidth, 1);
    viewer.style.width = Math.floor(logicalWidth * scale) + "px";
    viewer.style.height = availableHeight + "px";
    frame.style.width = logicalWidth + "px";
    frame.style.height = Math.ceil(availableHeight / scale) + "px";
    frame.style.transform = scale === 1 ? "none" : `scale(${scale})`;
    return;
  }
  // The parent's viewport dictates the height, never document scrolling.
  const available = {width: stage.clientWidth - 12, height: stage.clientHeight - 12};
  const fitted = fitPortrait(available);
  viewer.style.width = fitted.width + "px";
  viewer.style.height = fitted.height + "px";
  frame.style.width = PHONE.width + "px";
  frame.style.height = PHONE.height + "px";
  frame.style.transform = `scale(${fitted.scale})`;
}

// BM: Tukar butang pilihan dan skala tanpa menetapkan semula src agar sesi aplikasi dalam iframe tidak hilang.
// EN: Switch selected controls and scaling without resetting src, preserving the embedded application session.
function setView(mode) {
  if (mode !== "mobile" && mode !== "desktop") return;
  viewMode = mode;
  shell.dataset.view = mode;
  mobileButton.setAttribute("aria-pressed", String(mode === "mobile"));
  desktopButton.setAttribute("aria-pressed", String(mode === "desktop"));
  modeLabel.textContent = mode === "mobile" ? "Mobile view" : "Desktop view";
  layoutFrame();
  // Resize the same iframe: do not reset a user's game or account session.
}

// BM: Muat semula hanya apabila diminta atau produk mula dibuka; preview UI setempat menggunakan srcdoc terhad.
// EN: Load only on request or first open; the local UI showcase uses bounded srcdoc loading.
async function loadCurrent() {
  if (!current) return;
  // Reset the document and invalidate any earlier asynchronous preview load.
  clearFrame();
  if (current.localShowcase) {
    const version = frameVersion;
    try {
      // Trusted local HTML only: srcdoc avoids a framed HTTP navigation
      // and its response headers.
      const response = await fetch("/zrain-ui-showcase.html", {cache:"no-store"});
      if (!response.ok) throw new Error("Showcase unavailable");
      const markup = await response.text();
      if (version !== frameVersion || !current?.localShowcase) return;
      frame.srcdoc = markup;
    } catch {
      if (version !== frameVersion || !current?.localShowcase) return;
      frame.srcdoc = '<!doctype html><html><body style="font:16px sans-serif;padding:24px">' +
        '<h2>Unable to load Zrain UI preview</h2>' +
        '<p>Use Open in new tab to view the showcase.</p></body></html>';
    }
    return;
  }
  frame.src = current.webUrl;
}

// BM: Terima ID produk dikenali, buka dialog dan simpan butang pemanggil untuk pemulihan fokus selepas tutup.
// EN: Resolve a known product ID, open the dialog and remember the triggering control to restore focus afterward.
function openConsole(id, trigger) {
  const product = published.get(id) || PRODUCTS[id];
  if (!product || dialog.open) return;
  opener = trigger;
  current = {...product, localShowcase: id === "zrain-ui"};
  setView("mobile");
  icon.src = product.icon;
  icon.alt = "";
  name.textContent = product.name;
  description.textContent = product.description;
  frame.title = product.name + " web app";
  external.href = product.webUrl;
  external.title = 'Open website in new tab';
  external.setAttribute('aria-label', external.title);
  store.hidden = !product.storeUrl;
  if (product.storeUrl) store.href = product.storeUrl;
  else store.removeAttribute("href");
  dialog.showModal();
  layoutFrame();
  loadCurrent();
  close.focus();
}

// BM: Tamatkan fullscreen sebelum menutup dialog agar state browser kekal konsisten.
// EN: Exit fullscreen before closing the dialog to keep browser state consistent.
function closeConsole() {
  if (document.fullscreenElement === shell) {
    document.exitFullscreen?.().catch(() => {});
  }
  if (dialog.open) dialog.close();
}

// Static actions are registered directly; delegated clicks only handle new cards.
// This prevents duplicate open events when the original buttons are clicked.
// BM: Pendengar klik statik dipasang sekali; delegasi hanya menerima kad dinamik baharu.
// EN: Static click listeners are registered once; delegation handles only newly created cards.
const staticControls = new Set(document.querySelectorAll("[data-console]"));
for (const control of staticControls) {
  control.addEventListener("click", () => openConsole(control.dataset.console, control));
}
document.addEventListener("click", event => {
  const trigger = event.target?.closest?.("[data-console]");
  if (trigger && !staticControls.has(trigger)) openConsole(trigger.dataset.console, trigger);
});

mobileButton.addEventListener("click", () => setView("mobile"));
desktopButton.addEventListener("click", () => setView("desktop"));
reload.addEventListener("click", loadCurrent);
close.addEventListener("click", closeConsole);
fullscreen.addEventListener("click", () => {
  if (document.fullscreenElement === shell) document.exitFullscreen?.().catch(() => {});
  else shell.requestFullscreen?.().catch(() => {});
});

// BM: Close membersihkan iframe dan memulangkan fokus ke butang asal tanpa menyimpan state sesi.
// EN: Closing clears the iframe and returns focus to the opener without retaining session state.
dialog.addEventListener("close", () => {
  clearFrame();
  current = null;
  opener?.focus();
  opener = null;
});

dialog.addEventListener("click", event => {
  if (event.target === dialog) closeConsole();
});

// One layout function supports Mobile/Desktop toggles, viewport resizing,
// fullscreen and short laptop screens without changing the remote applications.
if (typeof ResizeObserver !== "undefined") {
  const resize = new ResizeObserver(layoutFrame);
  resize.observe(stage);
}
document.addEventListener("fullscreenchange", layoutFrame);
window.addEventListener("resize", layoutFrame);

// The public project page links into the REAL production Console.
// Only documented, built-in product IDs are accepted; no arbitrary iframe URL.
// BM: Parameter console hanya boleh memilih ID daripada senarai built-in, bukan URL bebas.
// EN: The console query parameter selects a built-in ID only, never an arbitrary URL.
const requestedDemo = new URLSearchParams(window.location?.search || "").get("console");
if (requestedDemo && Object.prototype.hasOwnProperty.call(PRODUCTS, requestedDemo)) {
  openConsole(requestedDemo, null);
}
