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
const profileDir = os.tmpdir() + '\\chrome-test-' + Date.now();
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9233',
  '--no-sandbox',
  '--disable-gpu',
  '--user-data-dir=' + profileDir
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const targetsRes = await fetch('http://localhost:9233/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await cdp.send('Page.navigate', { url: 'http://localhost:4321/about' });
  await new Promise(r => setTimeout(r, 2500));

  const res = await cdp.evaluate(`() => {
    const wrap = document.querySelector('.identity-orbit-wrap');
    const styleSheets = Array.from(document.styleSheets).map(s => {
      try {
        return Array.from(s.cssRules).map(r => r.cssText).filter(t => t.includes('identity-orbit-wrap'));
      } catch (e) {
        return ['error: ' + e.message];
      }
    });
    return {
      wrapStyle: wrap ? window.getComputedStyle(wrap).width : null,
      rules: styleSheets.flat()
    };
  }`);
  console.log('RULES IN BROWSER:', JSON.stringify(res, null, 2));
  cdp.ws.close();
} finally {
  chrome.kill();
}
