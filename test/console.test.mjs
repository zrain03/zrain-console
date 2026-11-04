/**
 * Fail / File: test/console.test.mjs
 * Pembangun / Developer: Zrain
 * Dicipta / Created: 2026-11-04
 * Dikemas kini / Last updated: 2026-11-04
 * BM: Uji kontrak snapshot Console melalui DOM palsu yang terasing tanpa browser/network.
 * EN: Test Console snapshot contracts through an isolated fake DOM without browser/network.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// BM: Sentiasa baca source sebenar supaya ujian tidak menguji implementasi duplikat.
// EN: Always read the actual source so tests do not exercise a duplicate implementation.
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const productSource = read('src/console-products.js');
const controllerSource = read('src/zrain-console.js');
const cssSource = read('src/zrain-console.css');
const PRODUCTS = runInNewContext(productSource.replace('export const PRODUCTS', 'const PRODUCTS') + '\nPRODUCTS;', {});

// BM: Bina elemen dengan API minimum yang digunakan oleh pengawal UI asal.
// EN: Create elements with only the minimal API used by the original UI controller.
function element(id, document) {
  const handlers = new Map();
  return {
    id, style:{}, dataset:{}, attributes:new Map(), open:false, hidden:false,
    clientWidth:970,clientHeight:580, href:'', src:'', srcdoc:'',
    addEventListener(type, handler) { handlers.set(type,handler); },
    setAttribute(key,value) { this.attributes.set(key,String(value)); },
    removeAttribute(key) { this.attributes.delete(key); if(key === 'src' || key === 'srcdoc') this[key]=''; },
    getAttribute(key) { return this.attributes.get(key) || null; },
    focus() { document.activeElement = this; },
    showModal() { this.open=true; },
    close() { this.open=false; this.fire('close'); },
    fire(type, event={}) { handlers.get(type)?.({target:this,...event}); },
  };
}

// BM: Sandbox menyediakan semua elemen host yang diperlukan, termasuk pemulihan fokus.
// EN: Sandbox supplies every required host element, including focus restoration.
function harness({query='', fetcher=async () => ({ok:false})}={}) {
  const document={activeElement:null,fullscreenElement:null};
  const ids=['zrain-console','console-stage','console-viewer','console-frame','console-icon',
    'console-title','console-description','console-mode','console-external','console-store',
    'console-reload','console-fullscreen','console-close','console-shell','console-mobile','console-desktop'];
  const e=Object.fromEntries(ids.map(id=>[id,element(id,document)]));
  const trigger=element('trigger',document);
  trigger.dataset.console='memory-rush';
  document.getElementById=id=>e[id];
  document.querySelectorAll=selector=>selector==='[data-console]'?[trigger]:[];
  const listeners=new Map();
  document.addEventListener=(type,handler)=>listeners.set(type,handler);
  document.fire=(type,event)=>listeners.get(type)?.(event);
  document.exitFullscreen=async()=>{};
  const window={location:{search:query},addEventListener() {}};
  const executable=controllerSource
    .replace(/^import \{ PRODUCTS \} from .*;\s*/m,'')
    .replace(/^export /gm,'');
  const code=executable+'\n({fitPortrait, registerPublishedProducts, openConsole, closeConsole, setView, loadCurrent});';
  const api=runInNewContext(code,{PRODUCTS,document,window,URLSearchParams,fetch:fetcher,
    console,Map,Set,Object,String,Number,Math,Promise}, {filename:'src/zrain-console.js'});
  return {api, e, document, trigger};
}

test('product snapshot contains all eleven production catalog IDs and only HTTPS destinations',()=>{
  const ids=Object.keys(PRODUCTS);
  assert.deepEqual(ids.sort(),[
    'guess-the-flag','memory-rush','zrain-auth-starter','zrain-links','zrain-monitor',
    'zrain-image-tools','zrain-pdf-tools','zrain-document-tools','zrain-developer-tools',
    'zrain-productivity-tools','zrain-ui'].sort());
  for(const id of ids){
    assert.match(PRODUCTS[id].webUrl,/^https:\/\//);
    assert.ok(PRODUCTS[id].name?.length>0);
  }
});

test('portrait preview stays within container bounds and caps upscale',()=>{
  const {fitPortrait}=harness().api;
  const narrow=fitPortrait({width:195,height:422});
  assert.equal(narrow.scale,0.5);
  assert.equal(narrow.width,195);
  assert.equal(narrow.height,422);
  const large=fitPortrait({width:3900,height:8440});
  assert.equal(large.scale,1.25);
  assert.equal(large.width,487);
  assert.equal(large.height,1055);
});

test('opening a built-in product sets a real iframe and mobile view by default',()=>{
  const {e,trigger,document}=harness();
  trigger.fire('click');
  assert.equal(e['zrain-console'].open,true);
  assert.equal(e['console-frame'].src,PRODUCTS['memory-rush'].webUrl);
  assert.equal(e['console-shell'].dataset.view,'mobile');
  assert.equal(e['console-mobile'].getAttribute('aria-pressed'),'true');
  assert.equal(document.activeElement,e['console-close']);
});

test('mobile-to-desktop switching preserves iframe source and game session',()=>{
  const {e,trigger}=harness();
  trigger.fire('click');
  const source=e['console-frame'].src;
  e['console-desktop'].fire('click');
  assert.equal(e['console-frame'].src,source);
  assert.equal(e['console-shell'].dataset.view,'desktop');
  assert.equal(e['console-desktop'].getAttribute('aria-pressed'),'true');
  assert.ok(parseInt(e['console-frame'].style.width,10)>=1100);
  e['console-mobile'].fire('click');
  assert.equal(e['console-frame'].src,source);
});

test('explicit reload resets iframe; close clears it and restores opener focus',()=>{
  const {e,trigger,document}=harness();
  trigger.fire('click');
  e['console-reload'].fire('click');
  assert.equal(e['console-frame'].src,PRODUCTS['memory-rush'].webUrl);
  e['console-close'].fire('click');
  assert.equal(e['zrain-console'].open,false);
  assert.equal(e['console-frame'].src,'');
  assert.equal(document.activeElement,trigger);
});

test('unknown query-string product IDs cannot open arbitrary websites',()=>{
  assert.equal(harness({query:'?console=https://example.com/'}).e['zrain-console'].open,false);
  assert.equal(harness({query:'?console=not-listed'}).e['zrain-console'].open,false);
  const valid=harness({query:'?console=zrain-links'});
  assert.equal(valid.e['zrain-console'].open,true);
  assert.equal(valid.e['console-frame'].src,PRODUCTS['zrain-links'].webUrl);
});

test('delegated dynamic card can open registered published product',()=>{
  const {api,e,document}=harness();
  api.registerPublishedProducts([{
    slug:'zrain-example',name:'Zrain Example',description:'Public published entry',
    logoUrl:'/zrain-logo.webp',primaryAction:'WEBSITE',primaryUrl:'https://example.com/'
  }]);
  const item=element('dynamic',document);
  item.dataset.console='zrain-example';
  document.fire('click',{target:{closest:()=>item}});
  assert.equal(e['zrain-console'].open,true);
  assert.equal(e['console-frame'].src,'https://example.com/');
});

test('closing while a local showcase fetch is outstanding ignores stale results',async()=>{
  let finish;
  const pending=new Promise(resolve=>{finish=resolve;});
  // BM: Panggilan semula ini hanya untuk menguji pembatalan hasil fetch lama.
  // EN: This callback tests invalidation of an outdated fetch result.
  const ctx=harness({fetcher:()=>pending, query:'?console=zrain-ui'});
  assert.equal(ctx.e['zrain-console'].open,true);
  ctx.e['console-close'].fire('click');
  finish({ok:true,text:async()=>'<html>stale</html>'});
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.equal(ctx.e['console-frame'].srcdoc,'');
});

test('styling remains scoped to the Console without overriding shared header navigation',()=>{
  assert.match(cssSource,/\.zrain-console\s*\{/);
  assert.match(cssSource,/\.console-view-switch/);
  assert.match(cssSource,/@media\s*\(max-width:\s*660px\)/);
  assert.doesNotMatch(cssSource,/\.zrain-header\s*\{|\.main-nav\s*\{/);
});
