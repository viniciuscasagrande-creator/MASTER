const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/evidence/referencia');
const ARTIFACT_DIR = 'C:\\Users\\vinad\\.gemini\\antigravity-cli\\brain\\fc32c114-4ea1-4eb6-806a-31abcc3d77e5';

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

  async captureScreenshot(filename) {
    const targetPath1 = path.join(OUTPUT_DIR, filename);
    const targetPath2 = path.join(ARTIFACT_DIR, filename);

    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(targetPath1, buffer);
    try {
      fs.writeFileSync(targetPath2, buffer);
    } catch {}
    console.log(`[Screenshot Saved] -> ${filename} (${buffer.length} bytes)`);
  }

  async close() {
    this.ws.close();
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('--- Iniciando Captura das Evidências da Referência Oficial ---');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  await sleep(2500);

  try {
    const versionRes = await fetch('http://127.0.0.1:9224/json/version');
    const versionData = await versionRes.json();
    console.log('Conectado ao Chrome:', versionData['Browser']);

    const newTabRes = await fetch('http://127.0.0.1:9224/json/new?http://localhost:5173/#overview', { method: 'PUT' });
    const target = await newTabRes.json();
    const wsUrl = target.webSocketDebuggerUrl;

    const client = new CDPClient(wsUrl);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    // Set Desktop 1920x1080 Viewport
    await client.setViewport(1920, 1080);
    await client.eval(`
      localStorage.setItem('token', 'dev_superadmin_token');
      localStorage.setItem('master_sidebar_expanded', 'true');
      localStorage.setItem('disk_theme_mode', 'light');
    `);

    // 1. master-home-referencia.png
    console.log('1. Capturando master-home-referencia.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
    await sleep(3000);
    await client.captureScreenshot('master-home-referencia.png');

    // 2. master-eventos-referencia.png
    console.log('2. Capturando master-eventos-referencia.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#events' });
    await sleep(2500);
    await client.captureScreenshot('master-eventos-referencia.png');

    // 3. master-financeiro-referencia.png
    console.log('3. Capturando master-financeiro-referencia.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#finance' });
    await sleep(2500);
    await client.captureScreenshot('master-financeiro-referencia.png');

    // 4. master-marketing-referencia.png
    console.log('4. Capturando master-marketing-referencia.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#marketing' });
    await sleep(2500);
    await client.captureScreenshot('master-marketing-referencia.png');

    // 5. master-sac-referencia.png
    console.log('5. Capturando master-sac-referencia.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#sac' });
    await sleep(2500);
    await client.captureScreenshot('master-sac-referencia.png');

    // 6. master-mobile-referencia.png
    console.log('6. Capturando master-mobile-referencia.png (390x844) ...');
    await client.setViewport(390, 844, true);
    await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
    await sleep(2500);
    await client.captureScreenshot('master-mobile-referencia.png');

    await client.close();
    console.log('\n--- Todas as 6 screenshots da Referência Oficial foram geradas com sucesso! ---');
  } catch (err) {
    console.error('Erro na execução do script:', err);
  } finally {
    try {
      chromeProcess.kill();
    } catch {}
  }
}

main().catch(console.error);
