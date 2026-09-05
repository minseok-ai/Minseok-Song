import { spawn } from 'child_process';
import os from 'os';

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

  async evaluate(fnStr) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(${fnStr})()`,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.value;
  }
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profileDir = os.tmpdir() + '\\chrome-gap-' + Date.now();
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9228',
  '--no-sandbox',
  '--disable-gpu',
  '--user-data-dir=' + profileDir
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const targetsRes = await fetch('http://localhost:9228/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });

  await cdp.send('Page.navigate', { url: 'http://localhost:4321/' });
  await new Promise(r => setTimeout(r, 2000));

  const data = await cdp.evaluate(`() => {
    const hero = document.querySelector('.hero-system');
    const copy = document.querySelector('.hero-copy-panel');
    const brief = document.querySelector('.hero-brief');
    const tools = document.querySelector('.tech-tools');
    const children = Array.from(hero.children).map(c => ({
      class: c.className,
      tag: c.tagName,
      top: c.getBoundingClientRect().top,
      bottom: c.getBoundingClientRect().bottom,
      height: c.getBoundingClientRect().height,
      gridRow: window.getComputedStyle(c).gridRow,
      gridColumn: window.getComputedStyle(c).gridColumn
    }));
    return {
      heroComputed: {
        display: window.getComputedStyle(hero).display,
        gridTemplateColumns: window.getComputedStyle(hero).gridTemplateColumns,
        gridTemplateRows: window.getComputedStyle(hero).gridTemplateRows,
        gap: window.getComputedStyle(hero).gap,
        paddingBottom: window.getComputedStyle(hero).paddingBottom,
        height: hero.getBoundingClientRect().height,
        top: hero.getBoundingClientRect().top,
        bottom: hero.getBoundingClientRect().bottom
      },
      children
    };
  }`);
  console.log('HERO CHILDREN:', JSON.stringify(data, null, 2));
  cdp.ws.close();
} catch (e) {
  console.error('Error:', e);
} finally {
  chrome.kill();
}
