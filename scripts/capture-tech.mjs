import { spawn } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\hubrisyne\\.gemini\\antigravity-ide\\brain\\b8a803d8-f61c-4ff1-9baf-ed8630ef4335';

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

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const fullPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(fullPath, buffer);
    return fullPath;
  }
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profileDir = os.tmpdir() + '\\chrome-tech-' + Date.now();
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9234',
  '--no-sandbox',
  '--disable-gpu',
  '--user-data-dir=' + profileDir
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const targetsRes = await fetch('http://localhost:9234/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await cdp.send('Page.navigate', { url: 'http://localhost:4321/' });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to Tech & Tools section
  await cdp.evaluate(`() => {
    const tools = document.querySelector('.tech-tools');
    if (tools) {
      tools.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }`);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('v2_home_tech_tools_refined.png');
  console.log('Captured Tech & Tools screenshot!');
  cdp.ws.close();
} finally {
  chrome.kill();
}
