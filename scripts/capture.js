import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const baseUrl = process.env.CAPTURE_BASE_URL || 'http://localhost:3000';
const chromePath =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = Number(process.env.CAPTURE_DEBUG_PORT || 9223);

const shots = [
  { name: 'desktop-hero.png', path: '/', width: 1440, height: 1000 },
  { name: 'desktop-section-about.png', path: '/', selector: '#about', width: 1440, height: 1200 },
  { name: 'desktop-section-projects.png', path: '/', selector: '#projects', width: 1440, height: 1200 },
  { name: 'desktop-section-methodology.png', path: '/', selector: '#methodology', width: 1440, height: 1200 },
  { name: 'desktop-section-contact.png', path: '/', selector: '#contact', width: 1440, height: 1200 },
  { name: 'mobile-hero.png', path: '/', width: 390, height: 900, mobile: true },
  { name: 'mobile-section-about.png', path: '/', selector: '#about', width: 390, height: 900, mobile: true },
  { name: 'mobile-section-methodology.png', path: '/', selector: '#methodology', width: 390, height: 900, mobile: true },
  { name: 'mobile-section-contact.png', path: '/', selector: '#contact', width: 390, height: 900, mobile: true },
  { name: 'desktop-full.png', path: '/', width: 1440, height: 1200, fullPage: true },
];

await mkdir('design-audit', { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${port}`,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'inherit'] });

function closeChrome() {
  if (!chrome.killed) chrome.kill();
}

process.on('exit', closeChrome);
process.on('SIGINT', () => {
  closeChrome();
  process.exit(130);
});

async function waitForWebSocketUrl() {
  const endpoint = `http://127.0.0.1:${port}/json/list`;
  for (let i = 0; i < 50; i += 1) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        const page = json.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
        if (page) return page.webSocketDebuggerUrl;
      }
    } catch {
      // Chrome is still starting.
    }
    await delay(100);
  }
  throw new Error('Timed out waiting for Chrome DevTools endpoint');
}

const ws = new WebSocket(await waitForWebSocketUrl());
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let id = 0;
const pending = new Map();

ws.addEventListener('message', ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  }
});

function send(method, params = {}) {
  const currentId = ++id;
  ws.send(JSON.stringify({ id: currentId, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(currentId, { resolve, reject });
  });
}

async function navigate(path) {
  const url = new URL(path, baseUrl).toString();
  const loadEvent = new Promise((resolve) => {
    const listener = ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.method === 'Page.loadEventFired') {
        ws.removeEventListener('message', listener);
        resolve();
      }
    };
    ws.addEventListener('message', listener);
  });

  await send('Page.navigate', { url });
  await loadEvent;
  await delay(800);
}

async function setViewport({ width, height, mobile = false }) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
}

async function runtimeEval(expression) {
  return send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
}

async function scrollTo(selector) {
  await runtimeEval(`
    (() => {
      const target = document.querySelector(${JSON.stringify(selector)});
      if (!target) return false;
      document.documentElement.style.scrollBehavior = 'auto';
      const y = target.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo(0, Math.max(0, y));
      return Math.round(window.scrollY);
    })()
  `);
  await delay(800);
}

async function screenshot({ name, fullPage = false }) {
  const params = { format: 'png', fromSurface: true };

  if (fullPage) {
    const { result } = await runtimeEval(`({
      width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
    })`);
    params.captureBeyondViewport = true;
    params.clip = {
      x: 0,
      y: 0,
      width: result.value.width,
      height: result.value.height,
      scale: 1,
    };
  } else {
    const { result } = await runtimeEval(`({
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight
    })`);
    params.clip = {
      x: result.value.x,
      y: result.value.y,
      width: result.value.width,
      height: result.value.height,
      scale: 1,
    };
  }

  const { data } = await send('Page.captureScreenshot', params);
  await writeFile(`design-audit/${name}`, Buffer.from(data, 'base64'));
}

await send('Page.enable');
await send('Runtime.enable');

for (const shot of shots) {
  await setViewport(shot);
  await navigate(shot.path);
  if (shot.selector) await scrollTo(shot.selector);
  await screenshot(shot);
}

ws.close();
closeChrome();

console.log(`Captured ${shots.length} screenshots to design-audit/`);
