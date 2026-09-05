import { spawn } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\hubrisyne\\.gemini\\antigravity-ide\\brain\\b8a803d8-f61c-4ff1-9baf-ed8630ef4335';
const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;

const VIEWPORTS = {
  desktop: { name: 'Desktop (1440x900)', width: 1440, height: 900, dsf: 1, mobile: false },
  tablet: { name: 'Tablet (768x1024)', width: 768, height: 1024, dsf: 2, mobile: true },
  mobile: { name: 'Mobile iPhone (390x844)', width: 390, height: 844, dsf: 3, mobile: true },
  mobileSmall: { name: 'Mobile Android (360x780)', width: 360, height: 780, dsf: 2, mobile: true },
  mobileSE: { name: 'Mobile SE (320x568)', width: 320, height: 568, dsf: 2, mobile: true }
};

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.reqId = 1;
    this.pending = new Map();
    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && this.pending.has(data.id)) {
        const resolve = this.pending.get(data.id);
        this.pending.delete(data.id);
        resolve(data);
      }
    };
  }

  async connect() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise(r => this.ws.onopen = r);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.reqId++;
      this.pending.set(id, (res) => {
        if (res.error) reject(new Error(JSON.stringify(res.error)));
        else resolve(res.result);
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async setViewport(vp) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dsf || 1,
      mobile: vp.mobile || false
    });
    await this.send('Emulation.setTouchEmulationEnabled', {
      enabled: vp.mobile || false
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 2000));
  }

  async evaluate(fnStr) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(${fnStr})()`,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function runDeepAudit() {
  console.log('=== STARTING DEEP COMPONENT AUDIT FOR ALL 5 SECTIONS ===');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = os.tmpdir() + '\\chrome-deep-' + Date.now();
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    '--user-data-dir=' + profileDir
  ]);

  await new Promise(r => setTimeout(r, 1800));

  try {
    const targetsRes = await fetch('http://localhost:9222/json/list');
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');

    const deepReport = {
      navButtons: {},
      section1_Hero: {},
      section2_LoopRails: {},
      section3_A1FirmPlatform: {},
      section4_A1ntuitizeManifold: {},
      section5_A1ChanHUD: {}
    };

    // =========================================================================
    // 1. NAV BUTTONS AUDIT ACROSS ALL VIEWPORTS
    // =========================================================================
    console.log('\n--- Auditing 5 Navigation Buttons ---');
    await cdp.navigate(`${BASE_URL}/`);
    for (const [key, vp] of Object.entries(VIEWPORTS)) {
      await cdp.setViewport(vp);
      await new Promise(r => setTimeout(r, 400));
      const navStats = await cdp.evaluate(`() => {
        const nav = document.querySelector('.numbered-nav');
        if (!nav) return null;
        const navRect = nav.getBoundingClientRect();
        const links = Array.from(nav.querySelectorAll('a')).map((a, i) => {
          const rect = a.getBoundingClientRect();
          const comp = window.getComputedStyle(a);
          const label = a.querySelector('.nav-label');
          const labelRect = label ? label.getBoundingClientRect() : null;
          return {
            index: i,
            text: a.innerText.trim(),
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            fontSize: comp.fontSize,
            padding: comp.padding,
            labelWidth: labelRect ? Math.round(labelRect.width * 10) / 10 : 0,
            isClipped: a.scrollWidth > a.clientWidth + 1 || (label && label.scrollWidth > label.clientWidth + 1)
          };
        });
        const widths = links.map(l => l.width);
        return {
          navWidth: Math.round(navRect.width * 10) / 10,
          navHeight: Math.round(navRect.height * 10) / 10,
          links,
          minWidth: Math.min(...widths),
          maxWidth: Math.max(...widths),
          widthDiff: Math.round((Math.max(...widths) - Math.min(...widths)) * 10) / 10,
          isBalanced: (Math.max(...widths) - Math.min(...widths)) <= 2
        };
      }`);
      deepReport.navButtons[key] = navStats;
    }

    // =========================================================================
    // 2. SECTION 1 (Hero & Minseok Song Overview) & SECTION 2 (Loop & Rails)
    // =========================================================================
    console.log('\n--- Auditing Section 1 (Hero) & Section 2 (Loop & Rails) ---');
    for (const [key, vp] of Object.entries(VIEWPORTS)) {
      await cdp.setViewport(vp);
      await new Promise(r => setTimeout(r, 400));
      const sec1and2 = await cdp.evaluate(`() => {
        const hero = document.querySelector('.hero-system');
        const heroTitle = document.querySelector('.hero-title');
        const heroDesc = document.querySelector('.hero-desc');
        const lineSpans = Array.from(document.querySelectorAll('.hero-title .hero-line-1, .hero-title .hero-line-2'));
        const actions = Array.from(document.querySelectorAll('.hero-actions a'));

        // Sec 2
        const loopCards = Array.from(document.querySelectorAll('.loop-card, .signal-step'));
        const surfaceCards = Array.from(document.querySelectorAll('.surface-card'));
        const prodBand = document.getElementById('product-band');

        return {
          sec1: {
            containerWidth: hero ? Math.round(hero.getBoundingClientRect().width) : null,
            containerHeight: hero ? Math.round(hero.getBoundingClientRect().height) : null,
            titleFontSize: heroTitle ? window.getComputedStyle(heroTitle).fontSize : null,
            titleLineHeight: heroTitle ? window.getComputedStyle(heroTitle).lineHeight : null,
            titleWidth: heroTitle ? Math.round(heroTitle.getBoundingClientRect().width) : null,
            titleScrollWidth: heroTitle ? heroTitle.scrollWidth : null,
            titleIsClipped: heroTitle ? heroTitle.scrollWidth > heroTitle.clientWidth + 1 : false,
            lineSpans: lineSpans.map(s => ({
              text: s.innerText,
              width: Math.round(s.getBoundingClientRect().width),
              right: Math.round(s.getBoundingClientRect().right),
              docWidth: document.documentElement.clientWidth,
              spill: Math.round(s.getBoundingClientRect().right - document.documentElement.clientWidth)
            })),
            descFontSize: heroDesc ? window.getComputedStyle(heroDesc).fontSize : null,
            actions: actions.map(a => ({
              text: a.innerText.trim(),
              width: Math.round(a.getBoundingClientRect().width),
              height: Math.round(a.getBoundingClientRect().height)
            }))
          },
          sec2: {
            loopCardCount: loopCards.length,
            loopCardSizes: loopCards.map(c => ({
              width: Math.round(c.getBoundingClientRect().width),
              height: Math.round(c.getBoundingClientRect().height),
              isClipped: c.scrollWidth > c.clientWidth + 1
            })),
            surfaceCardCount: surfaceCards.length,
            surfaceCardSizes: surfaceCards.map(c => ({
              width: Math.round(c.getBoundingClientRect().width),
              height: Math.round(c.getBoundingClientRect().height),
              isClipped: c.scrollWidth > c.clientWidth + 1
            })),
            productBand: prodBand ? {
              width: Math.round(prodBand.getBoundingClientRect().width),
              height: Math.round(prodBand.getBoundingClientRect().height),
              titleFontSize: window.getComputedStyle(prodBand.querySelector('h2')).fontSize
            } : null
          }
        };
      }`);
      deepReport.section1_Hero[key] = sec1and2.sec1;
      deepReport.section2_LoopRails[key] = sec1and2.sec2;
    }

    // =========================================================================
    // 3. SECTION 3 (A1-Firm Platform) & SECTION 4 (A1ntuitize 3D Manifold)
    // =========================================================================
    console.log('\n--- Auditing Section 3 (A1-Firm) & Section 4 (A1ntuitize Manifold) ---');
    await cdp.navigate(`${BASE_URL}/A1-Firm`);

    for (const [key, vp] of Object.entries(VIEWPORTS)) {
      await cdp.setViewport(vp);
      await new Promise(r => setTimeout(r, 600));

      const sec3and4 = await cdp.evaluate(`() => {
        // Section 3
        const heroTitle = document.querySelector('.product-hero h1');
        const routerCards = Array.from(document.querySelectorAll('.router-card'));
        const domainCards = Array.from(document.querySelectorAll('.domain-card'));

        // Section 4
        const manifoldSection = document.getElementById('a1ntuitize-sealed');
        const canvas = document.getElementById('manifold-canvas');
        const deck = document.querySelector('.manifold-synthesizer-deck');
        const octButtons = Array.from(document.querySelectorAll('.oct-seg-btn'));
        const meters = Array.from(document.querySelectorAll('.meter-inline-item'));
        const activeLobe = document.getElementById('cm-active-name');
        const bottomStrip = document.querySelector('.deck-bottom-strip');

        return {
          sec3: {
            heroTitleFontSize: heroTitle ? window.getComputedStyle(heroTitle).fontSize : null,
            heroTitleWidth: heroTitle ? Math.round(heroTitle.getBoundingClientRect().width) : null,
            heroTitleIsClipped: heroTitle ? heroTitle.scrollWidth > heroTitle.clientWidth + 1 : false,
            routerCardCount: routerCards.length,
            routerCardWidths: routerCards.map(c => Math.round(c.getBoundingClientRect().width)),
            domainCardCount: domainCards.length,
            domainCardWidths: domainCards.map(c => Math.round(c.getBoundingClientRect().width))
          },
          sec4: {
            manifoldWidth: manifoldSection ? Math.round(manifoldSection.getBoundingClientRect().width) : null,
            canvasWidth: canvas ? Math.round(canvas.getBoundingClientRect().width) : null,
            canvasHeight: canvas ? Math.round(canvas.getBoundingClientRect().height) : null,
            deckWidth: deck ? Math.round(deck.getBoundingClientRect().width) : null,
            deckHeight: deck ? Math.round(deck.getBoundingClientRect().height) : null,
            deckPadding: deck ? window.getComputedStyle(deck).padding : null,
            octantCount: octButtons.length,
            octantButtons: octButtons.map((btn, i) => {
              const rect = btn.getBoundingClientRect();
              const titleEl = btn.querySelector('.osb-title');
              const massEl = btn.querySelector('.osb-mass-num');
              const idxEl = btn.querySelector('.osb-index');
              return {
                index: i + 1,
                name: titleEl ? titleEl.innerText.trim() : btn.innerText.trim(),
                width: Math.round(rect.width * 10) / 10,
                height: Math.round(rect.height * 10) / 10,
                fontSize: titleEl ? window.getComputedStyle(titleEl).fontSize : window.getComputedStyle(btn).fontSize,
                isClipped: btn.scrollWidth > btn.clientWidth + 1 || (titleEl && titleEl.scrollWidth > titleEl.clientWidth + 1)
              };
            }),
            octantWidths: octButtons.map(b => Math.round(b.getBoundingClientRect().width * 10) / 10),
            meters: meters.map(m => {
              const rect = m.getBoundingClientRect();
              const label = m.querySelector('.mii-label')?.innerText.trim();
              const val = m.querySelector('.mii-val')?.innerText.trim();
              return {
                label,
                val,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                fontSize: m.querySelector('.mii-val') ? window.getComputedStyle(m.querySelector('.mii-val')).fontSize : null
              };
            }),
            activeLobeText: activeLobe ? activeLobe.innerText.trim() : null,
            bottomStripWidth: bottomStrip ? Math.round(bottomStrip.getBoundingClientRect().width) : null,
            bottomStripWrap: bottomStrip ? bottomStrip.scrollWidth > bottomStrip.clientWidth + 1 : false
          }
        };
      }`);
      deepReport.section3_A1FirmPlatform[key] = sec3and4.sec3;
      deepReport.section4_A1ntuitizeManifold[key] = sec3and4.sec4;
    }

    // =========================================================================
    // 4. SECTION 5 (A1-Chan HUD Overlay)
    // =========================================================================
    console.log('\n--- Auditing Section 5 (A1-Chan HUD) ---');
    for (const [key, vp] of Object.entries({ desktop: VIEWPORTS.desktop, mobile: VIEWPORTS.mobile, mobileSmall: VIEWPORTS.mobileSmall })) {
      await cdp.setViewport(vp);
      await new Promise(r => setTimeout(r, 400));
      const hudData = await cdp.evaluate(`() => {
        const trigger = document.querySelector('.a1-navigator__trigger');
        const panel = document.querySelector('.a1-navigator__panel');
        const triggerRect = trigger ? trigger.getBoundingClientRect() : null;
        const comp = trigger ? window.getComputedStyle(trigger) : null;
        return {
          triggerPresent: !!trigger,
          triggerWidth: triggerRect ? Math.round(triggerRect.width) : null,
          triggerHeight: triggerRect ? Math.round(triggerRect.height) : null,
          triggerBottom: triggerRect ? Math.round(window.innerHeight - triggerRect.bottom) : null,
          triggerRight: triggerRect ? Math.round(window.innerWidth - triggerRect.right) : null,
          zIndex: comp ? comp.zIndex : null,
          panelMaxWidth: panel ? window.getComputedStyle(panel).maxWidth : null
        };
      }`);
      deepReport.section5_A1ChanHUD[key] = hudData;
    }

    const outPath = path.join(ARTIFACT_DIR, 'deep_audit_report.json');
    fs.writeFileSync(outPath, JSON.stringify(deepReport, null, 2));
    console.log('\nDeep audit complete! Report saved to:', outPath);
    console.log(JSON.stringify(deepReport, null, 2));

    cdp.close();
  } catch (err) {
    console.error('Deep audit error:', err);
  } finally {
    chrome.kill();
  }
}

runDeepAudit();
