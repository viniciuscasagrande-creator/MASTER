const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/evidence/phase-1.3.11.1.4.4.1');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ready = new Promise((resolve) => {
      this.ws.onopen = resolve;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }

  async send(method, params = {}) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async setViewport(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
  }

  async captureScreenshot(filepath, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const { data } = await this.send('Page.captureScreenshot', params);
    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot: ${path.basename(filepath)}`);
  }

  async close() {
    this.ws.close();
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('Starting Chrome headless with CDP...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  await sleep(2000);

  try {
    const versionRes = await fetch('http://127.0.0.1:9222/json/version');
    const versionData = await versionRes.json();
    console.log('Connected to Chrome:', versionData['Browser']);

    const newTabRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:5173/#overview', { method: 'PUT' });
    const target = await newTabRes.json();
    const wsUrl = target.webSocketDebuggerUrl;

    const client = new CDPClient(wsUrl);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    // Set standard 1920x1080 Viewport
    await client.setViewport(1920, 1080);
    console.log('Setting auth token in localStorage...');
    await client.eval(`
      localStorage.setItem('token', 'dev_superadmin_token');
      localStorage.setItem('master_sidebar_expanded', 'true');
    `);

    console.log('Navigating to http://localhost:5173/#overview ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
    await sleep(2500);

    // 01: Visão Geral (Light workspace, white cards, dark sidebar, light header)
    console.log('Capturing 01-visao-geral.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '01-visao-geral.png'));

    // 02: Sidebar Produtor (Producer sidebar expanded with 5 categories)
    console.log('Capturing 02-sidebar-produtor.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '02-sidebar-produtor.png'));

    // 03: Seleção de Evento (abrir Popover de eventos no Header)
    console.log('Opening Event Popover in Header...');
    await client.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('header button'));
        const eventBtn = buttons.find(b => b.querySelector('svg.text-cyan-600'));
        if (eventBtn) {
          eventBtn.click();
          return 'clicked event button';
        }
        return 'not found';
      })()
    `);
    await sleep(800);
    console.log('Capturing 03-selecao-evento.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '03-selecao-evento.png'));

    // 04: Contexto de Evento Selecionado
    console.log('Selecting specific event in popover...');
    await client.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('div.shadow-2xl button'));
        if (buttons.length > 1) {
          buttons[1].click();
          return 'clicked event: ' + buttons[1].textContent;
        }
        return 'button not found';
      })()
    `);
    await sleep(2000);
    console.log('Capturing 04-contexto-evento.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '04-contexto-evento.png'));

    // 05: Hub Financeiro
    console.log('Navigating to #finance ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#finance' });
    await sleep(2000);
    console.log('Capturing 05-hub-financeiro.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '05-hub-financeiro.png'));

    // 06: Hub Eventos
    console.log('Navigating to #events ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#events' });
    await sleep(2000);
    console.log('Capturing 06-hub-eventos.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '06-hub-eventos.png'));

    // 07: Hub Comercial
    console.log('Navigating to #commercial ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#commercial' });
    await sleep(2500);
    console.log('Capturing 07-hub-comercial.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '07-hub-comercial.png'));

    // 08: Hub SAC
    console.log('Navigating to #sac ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#sac' });
    await sleep(2000);
    console.log('Capturing 08-hub-sac.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '08-hub-sac.png'));

    // 09: Hub Estorno
    console.log('Navigating to #refunds ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#refunds' });
    await sleep(2000);
    console.log('Capturing 09-hub-estorno.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '09-hub-estorno.png'));

    // 10: Breadcrumbs de Navegação
    console.log('Capturing 10-breadcrumbs-navegacao.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#commercial' });
    await sleep(1500);
    await client.captureScreenshot(path.join(OUTPUT_DIR, '10-breadcrumbs-navegacao.png'));

    // 11: Mobile Responsive
    console.log('Switching to mobile viewport (390x844)...');
    await client.setViewport(390, 844, true);
    await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
    await sleep(2000);
    console.log('Capturing 11-mobile.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '11-mobile.png'));

    await client.close();
    console.log('All 11 screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    chromeProcess.kill();
  }
}

main();
