import { spawn } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\hubrisyne\\.gemini\\antigravity-ide\\brain\\b8a803d8-f61c-4ff1-9baf-ed8630ef4335';
const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  mobileSmall: { width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  mobileSE: { width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
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
      deviceScaleFactor: vp.deviceScaleFactor || 1,
      mobile: vp.isMobile || false
    });
    await this.send('Emulation.setTouchEmulationEnabled', {
      enabled: vp.hasTouch || false
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 2200));
  }

  async evaluate(fnStr) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(${fnStr})()`,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.value;
  }

  async setTheme(theme) {
    return this.evaluate(`() => {
      document.documentElement.setAttribute('data-theme', '${theme}');
      document.documentElement.dataset.resolvedTheme = '${theme}';
      document.documentElement.style.colorScheme = '${theme === 'dark' ? 'only dark' : 'only light'}';
      window.__getResolvedSiteTheme = () => '${theme}';
      window.dispatchEvent(new CustomEvent('site-theme-change', { detail: { theme: '${theme}', mode: 'manual' } }));
    }`);
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const fullPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(fullPath, buffer);
    return fullPath;
  }

  close() {
    this.ws.close();
  }
}

async function runCensus() {
  console.log('--- STARTING SECTION CENSUS AND VIEWPORT AUDIT ---');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = os.tmpdir() + '\\chrome-audit-' + Date.now();
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
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');

    const results = {
      timestamp: new Date().toISOString(),
      sections: {},
      navButtonsAudit: {},
      overflowViolations: []
    };

    // =========================================================================
    // AUDIT 1: HOME PAGE (Sections 1 & 2: Hero, TechTools, Loop, Grid, ProductBand)
    // =========================================================================
    console.log('\n>>> AUDITING ROUTE: / (Home)');
    await cdp.navigate(`${BASE_URL}/`);

    for (const [vpName, vp] of Object.entries({ desktop: VIEWPORTS.desktop, mobile: VIEWPORTS.mobile, mobileSmall: VIEWPORTS.mobileSmall })) {
      await cdp.setViewport(vp);
      await new Promise(r => setTimeout(r, 800));

      // Measure 5 Navigation Buttons
      const navData = await cdp.evaluate(`() => {
        const nav = document.querySelector('.numbered-nav');
        if (!nav) return null;
        const navRect = nav.getBoundingClientRect();
        const navComputed = window.getComputedStyle(nav);
        const links = Array.from(nav.querySelectorAll('a')).map((a, idx) => {
          const rect = a.getBoundingClientRect();
          const comp = window.getComputedStyle(a);
          const label = a.querySelector('.nav-label');
          const labelComp = label ? window.getComputedStyle(label) : null;
          return {
            index: idx,
            text: a.innerText.trim(),
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            x: Math.round(rect.x * 10) / 10,
            fontSize: comp.fontSize,
            padding: comp.padding,
            textOverflow: labelComp?.textOverflow || 'none',
            isClipped: a.scrollWidth > a.clientWidth + 1 || (label && label.scrollWidth > label.clientWidth + 1)
          };
        });
        const widths = links.map(l => l.width);
        const minW = Math.min(...widths);
        const maxW = Math.max(...widths);
        return {
          navWidth: Math.round(navRect.width * 10) / 10,
          navHeight: Math.round(navRect.height * 10) / 10,
          display: navComputed.display,
          gridColumns: navComputed.gridTemplateColumns,
          links,
          minWidth: minW,
          maxWidth: maxW,
          widthSpread: Math.round((maxW - minW) * 10) / 10,
          isBalanced: (maxW - minW) <= 2.5
        };
      }`);
      results.navButtonsAudit[vpName] = navData;

      // Measure Section 1: Hero & Identity
      const heroData = await cdp.evaluate(`() => {
        const hero = document.querySelector('.hero-system') || document.querySelector('.home-page > .reveal-up:first-child');
        const title = document.querySelector('.hero-title') || document.querySelector('h1');
        const kicker = document.querySelector('.hero-kicker') || document.querySelector('.hero-system .micro-label');
        const focusStrip = document.querySelector('.hero-focus-strip') || document.querySelector('.focus-strip');
        const bio = document.querySelector('.hero-bio') || document.querySelector('.hero-copy') || document.querySelector('.hero-system p');
        const ctAs = Array.from(document.querySelectorAll('.hero-actions a, .hero-system .action-button, .hero-system a.primary-action'));

        return {
          container: hero ? {
            width: Math.round(hero.getBoundingClientRect().width),
            height: Math.round(hero.getBoundingClientRect().height),
            padding: window.getComputedStyle(hero).padding
          } : null,
          title: title ? {
            text: title.innerText.trim(),
            fontSize: window.getComputedStyle(title).fontSize,
            lineHeight: window.getComputedStyle(title).lineHeight,
            width: Math.round(title.getBoundingClientRect().width),
            height: Math.round(title.getBoundingClientRect().height),
            isClipped: title.scrollWidth > title.clientWidth + 1
          } : null,
          kicker: kicker ? {
            fontSize: window.getComputedStyle(kicker).fontSize,
            text: kicker.innerText.trim()
          } : null,
          bio: bio ? {
            fontSize: window.getComputedStyle(bio).fontSize,
            lineHeight: window.getComputedStyle(bio).lineHeight,
            width: Math.round(bio.getBoundingClientRect().width)
          } : null,
          ctaCount: ctAs.length,
          ctaSizes: ctAs.map(cta => ({
            text: cta.innerText.trim(),
            width: Math.round(cta.getBoundingClientRect().width),
            height: Math.round(cta.getBoundingClientRect().height),
            fontSize: window.getComputedStyle(cta).fontSize
          }))
        };
      }`);

      // Measure Section 2: Operating Loop & Rails
      const sec2Data = await cdp.evaluate(`() => {
        const loop = document.querySelector('.operating-loop') || document.querySelector('.signal-loop');
        const loopCards = Array.from(document.querySelectorAll('.loop-card, .signal-step')).map(c => {
          const rect = c.getBoundingClientRect();
          const comp = window.getComputedStyle(c);
          return {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            fontSize: comp.fontSize,
            isClipped: c.scrollWidth > c.clientWidth + 1
          };
        });

        const toolsRail = document.querySelector('.tools-rail') || document.querySelector('.tech-rail');
        const railItems = Array.from(document.querySelectorAll('.tool-chip, .tech-chip, .rail-item'));

        const surfaceGrid = document.querySelector('.surface-grid');
        const surfaceCards = Array.from(document.querySelectorAll('.surface-card, .entry-card')).map(c => {
          const rect = c.getBoundingClientRect();
          return {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            isClipped: c.scrollWidth > c.clientWidth + 1
          };
        });

        const productBand = document.getElementById('product-band');
        const bandTitle = productBand?.querySelector('h2');
        const bandAction = productBand?.querySelector('.primary-action');

        return {
          loopCardCount: loopCards.length,
          loopCards,
          toolsRailWidth: toolsRail ? Math.round(toolsRail.getBoundingClientRect().width) : null,
          railItemCount: railItems.length,
          surfaceCardCount: surfaceCards.length,
          surfaceCards,
          productBand: productBand ? {
            width: Math.round(productBand.getBoundingClientRect().width),
            height: Math.round(productBand.getBoundingClientRect().height),
            titleFontSize: bandTitle ? window.getComputedStyle(bandTitle).fontSize : null,
            actionWidth: bandAction ? Math.round(bandAction.getBoundingClientRect().width) : null
          } : null
        };
      }`);

      results.sections[`home_${vpName}`] = { hero: heroData, sec2: sec2Data };

      // Take screenshot for visual inspection
      await cdp.screenshot(`audit_home_${vpName}.png`);
    }

    // =========================================================================
    // AUDIT 2: A1-FIRM PAGE (Sections 3 & 4: Flagship Platform & A1ntuitize Manifold)
    // =========================================================================
    console.log('\n>>> AUDITING ROUTE: /A1-Firm (Flagship Platform, LLM Router, Domains, A1ntuitize)');
    await cdp.navigate(`${BASE_URL}/A1-Firm`);

    for (const [vpName, vp] of Object.entries({ desktop: VIEWPORTS.desktop, mobile: VIEWPORTS.mobile, mobileSmall: VIEWPORTS.mobileSmall })) {
      await cdp.setViewport(vp);
      await new Promise(r => setTimeout(r, 1000));

      const a1FirmData = await cdp.evaluate(`() => {
        // Section 3: A1trategize Platform
        const hero = document.querySelector('.product-hero');
        const heroTitle = hero?.querySelector('h1');
        const appLaunch = hero?.querySelector('.app-launch');
        const statStrip = hero?.querySelector('.product-stat-strip');
        const statItems = Array.from(statStrip?.querySelectorAll('span') || []);

        const routerBoard = document.querySelector('.llm-router-board');
        const routerCards = Array.from(document.querySelectorAll('.router-card')).map(c => {
          const rect = c.getBoundingClientRect();
          const title = c.querySelector('h3')?.innerText.trim();
          const desc = c.querySelector('small');
          return {
            title,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            fontSize: window.getComputedStyle(c).fontSize,
            isClipped: c.scrollWidth > c.clientWidth + 1 || (desc && desc.scrollWidth > desc.clientWidth + 1)
          };
        });

        const domainsBoard = document.querySelector('.domains-overview');
        const domainCards = Array.from(document.querySelectorAll('.domain-card')).map(c => {
          const rect = c.getBoundingClientRect();
          const title = c.querySelector('.domain-title')?.innerText.trim();
          return {
            title,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            isClipped: c.scrollWidth > c.clientWidth + 1
          };
        });

        // Section 4: A1ntuitize 3D Manifold & Synthesizer Deck
        const manifold = document.getElementById('a1ntuitize') || document.querySelector('.a1ntuitize-manifold');
        const canvas = document.getElementById('manifold-canvas') || manifold?.querySelector('canvas');
        const deck = document.querySelector('.manifold-synthesizer-deck');
        
        // Ribbon Octant buttons
        const octantButtons = Array.from(document.querySelectorAll('.deck-octant-btn, .octant-btn, .octant-ribbon button')).map((btn, i) => {
          const rect = btn.getBoundingClientRect();
          const label = btn.querySelector('.btn-label') || btn;
          return {
            index: i,
            text: btn.innerText.trim().replace(/\\n/g, ' '),
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            fontSize: window.getComputedStyle(btn).fontSize,
            isClipped: btn.scrollWidth > btn.clientWidth + 1 || (label && label.scrollWidth > label.clientWidth + 1)
          };
        });

        // Realtime Coordinate Meters Inline
        const metersInline = document.querySelector('.deck-meters-inline') || document.querySelector('.manifold-meters');
        const meterCards = Array.from(document.querySelectorAll('.meter-card, .deck-meter')).map(m => {
          const rect = m.getBoundingClientRect();
          return {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            isClipped: m.scrollWidth > m.clientWidth + 1
          };
        });

        // Trajectory log & controls
        const trajLog = document.querySelector('.trajectory-log, .log-viewport');

        return {
          section3: {
            heroTitle: heroTitle ? {
              fontSize: window.getComputedStyle(heroTitle).fontSize,
              lineHeight: window.getComputedStyle(heroTitle).lineHeight,
              width: Math.round(heroTitle.getBoundingClientRect().width),
              isClipped: heroTitle.scrollWidth > heroTitle.clientWidth + 1
            } : null,
            appLaunch: appLaunch ? {
              width: Math.round(appLaunch.getBoundingClientRect().width),
              height: Math.round(appLaunch.getBoundingClientRect().height)
            } : null,
            statItems: statItems.map(s => s.innerText.trim()),
            routerCards,
            domainCards
          },
          section4: {
            manifoldContainer: manifold ? {
              width: Math.round(manifold.getBoundingClientRect().width),
              height: Math.round(manifold.getBoundingClientRect().height)
            } : null,
            canvas: canvas ? {
              width: Math.round(canvas.getBoundingClientRect().width),
              height: Math.round(canvas.getBoundingClientRect().height)
            } : null,
            deck: deck ? {
              width: Math.round(deck.getBoundingClientRect().width),
              height: Math.round(deck.getBoundingClientRect().height),
              padding: window.getComputedStyle(deck).padding
            } : null,
            octantButtonCount: octantButtons.length,
            octantButtons,
            octantWidths: octantButtons.map(b => b.width),
            octantWidthSpread: octantButtons.length ? Math.round((Math.max(...octantButtons.map(b => b.width)) - Math.min(...octantButtons.map(b => b.width))) * 10) / 10 : 0,
            meterCards,
            trajLogHeight: trajLog ? Math.round(trajLog.getBoundingClientRect().height) : null
          }
        };
      }`);

      results.sections[`a1firm_${vpName}`] = a1FirmData;
      await cdp.screenshot(`audit_a1firm_${vpName}.png`);
    }

    // =========================================================================
    // AUDIT 3: A1-CHAN HUD OVERLAY (Section 5)
    // =========================================================================
    console.log('\n>>> AUDITING SECTION 5: A1-Chan HUD & Chatbot Drawer');
    for (const [vpName, vp] of Object.entries({ desktop: VIEWPORTS.desktop, mobile: VIEWPORTS.mobile })) {
      await cdp.setViewport(vp);
      await new Promise(r => setTimeout(r, 600));

      const a1ChanData = await cdp.evaluate(`() => {
        const trigger = document.querySelector('.a1-navigator__trigger') || document.querySelector('#a1-chan-trigger');
        const triggerRect = trigger ? trigger.getBoundingClientRect() : null;
        const panel = document.querySelector('.a1-navigator__panel') || document.querySelector('.a1-chan-panel');
        const textarea = document.querySelector('.a1-chat__input, .a1-chan-input, textarea');

        return {
          trigger: trigger ? {
            width: Math.round(triggerRect.width),
            height: Math.round(triggerRect.height),
            bottom: Math.round(window.innerHeight - triggerRect.bottom),
            right: Math.round(window.innerWidth - triggerRect.right),
            zIndex: window.getComputedStyle(trigger).zIndex
          } : null,
          panel: panel ? {
            width: Math.round(panel.getBoundingClientRect().width),
            height: Math.round(panel.getBoundingClientRect().height),
            maxHeight: window.getComputedStyle(panel).maxHeight,
            fontSize: window.getComputedStyle(panel).fontSize
          } : null,
          inputFontSize: textarea ? window.getComputedStyle(textarea).fontSize : null,
          iosZoomSafe: textarea ? parseFloat(window.getComputedStyle(textarea).fontSize) >= 16 : null
        };
      }`);
      results.sections[`a1chan_${vpName}`] = a1ChanData;
    }

    // =========================================================================
    // AUDIT 4: GLOBAL OVERFLOW AND CLIPPING SWEEP ACROSS ALL PAGES
    // =========================================================================
    console.log('\n>>> AUDITING GLOBAL OVERFLOW & TEXT TRUNCATION');
    for (const pagePath of ['/', '/A1-Firm', '/about', '/projects', '/contacts']) {
      await cdp.navigate(`${BASE_URL}${pagePath}`);
      for (const [vpName, vp] of Object.entries({ desktop: VIEWPORTS.desktop, mobile: VIEWPORTS.mobile, mobileSmall: VIEWPORTS.mobileSmall })) {
        await cdp.setViewport(vp);
        await new Promise(r => setTimeout(r, 600));

        const pageViolations = await cdp.evaluate(`() => {
          const docWidth = document.documentElement.clientWidth;
          const bodyWidth = document.body.clientWidth;
          const violations = [];

          // Check all elements for horizontal overflow
          const allElements = document.querySelectorAll('body *');
          for (const el of allElements) {
            const rect = el.getBoundingClientRect();
            // Skip hidden or zero-size elements
            if (rect.width === 0 || rect.height === 0) continue;
            // Ignore A1-Chan floating or off-screen panels
            if (el.closest('.a1-navigator__panel') || el.closest('#browser-recommendation-toast')) continue;

            // Helper to check if any ancestor clips overflow
            let isClipped = false;
            let parent = el.parentElement;
            while (parent && parent !== document.body) {
              const pStyle = window.getComputedStyle(parent);
              if (pStyle.overflow === 'hidden' || pStyle.overflowX === 'hidden' || pStyle.overflowX === 'clip' || pStyle.overflow === 'clip') {
                isClipped = true;
                break;
              }
              parent = parent.parentElement;
            }

            // Check if element spills past viewport width and is unclipped
            if (!isClipped && rect.right > docWidth + 2) {
              const tag = el.tagName.toLowerCase();
              const cls = el.className ? '.' + String(el.className).trim().replace(/\\s+/g, '.') : '';
              violations.push({
                type: 'HORIZONTAL_OVERFLOW',
                element: tag + cls,
                rectRight: Math.round(rect.right),
                docWidth,
                spillPx: Math.round(rect.right - docWidth)
              });
              if (violations.length > 8) break;
            }

            // Check for clipped text without ellipsis
            if (el.childElementCount === 0 && el.innerText && el.innerText.trim().length > 0) {
              if (el.scrollWidth > el.clientWidth + 3) {
                const comp = window.getComputedStyle(el);
                if (comp.overflow === 'hidden' && comp.textOverflow !== 'ellipsis' && comp.whiteSpace === 'nowrap') {
                  const tag = el.tagName.toLowerCase();
                  const cls = el.className ? '.' + String(el.className).trim().replace(/\\s+/g, '.') : '';
                  violations.push({
                    type: 'TEXT_CLIPPING_WITHOUT_ELLIPSIS',
                    element: tag + cls,
                    text: el.innerText.slice(0, 30),
                    scrollWidth: el.scrollWidth,
                    clientWidth: el.clientWidth
                  });
                }
              }
            }
          }
          return violations;
        }`);

        if (pageViolations && pageViolations.length > 0) {
          results.overflowViolations.push({
            page: pagePath,
            viewport: vpName,
            violations: pageViolations
          });
        }
      }
    }

    // Save full JSON report
    const reportPath = path.join(ARTIFACT_DIR, 'census_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nCensus completed! Report saved to: ${reportPath}`);
    console.log(JSON.stringify(results, null, 2));

    cdp.close();
  } catch (err) {
    console.error('Census error:', err);
  } finally {
    chrome.kill();
  }
}

runCensus();
