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
    } catch (e) {
      console.warn('Could not write to artifact dir:', e.message);
    }
    console.log(`[Screenshot Saved] -> ${filename} (${buffer.length} bytes)`);
  }

  async close() {
    this.ws.close();
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('--- Iniciando Captura das 8 Evidências Oficiais do Tema Claro ---');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  await sleep(2500);

  try {
    const versionRes = await fetch('http://127.0.0.1:9225/json/version');
    const versionData = await versionRes.json();
    console.log('Conectado ao Chrome:', versionData['Browser']);

    const newTabRes = await fetch('http://127.0.0.1:9225/json/new?http://localhost:5173/#overview', { method: 'PUT' });
    const target = await newTabRes.json();
    const wsUrl = target.webSocketDebuggerUrl;

    const client = new CDPClient(wsUrl);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    // Configure 1440x900 Desktop Viewport and Ensure Light Theme
    await client.setViewport(1440, 900);
    await client.eval(`
      localStorage.setItem('token', 'dev_superadmin_token');
      localStorage.setItem('master_sidebar_expanded', 'true');
      localStorage.setItem('disk_theme_mode', 'light');
      document.documentElement.classList.remove('dark');
    `);

    // 1. 01-home-claro.png (Home / Overview)
    console.log('1. Capturando 01-home-claro.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
    await sleep(3000);
    await client.eval(`document.documentElement.classList.remove('dark');`);
    await client.captureScreenshot('01-home-claro.png');

    // 2. 02-eventos-claro.png (Eventos)
    console.log('2. Capturando 02-eventos-claro.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#events' });
    await sleep(2500);
    await client.eval(`document.documentElement.classList.remove('dark');`);
    await client.captureScreenshot('02-eventos-claro.png');

    // 3. 03-financeiro-claro.png (Financeiro)
    console.log('3. Capturando 03-financeiro-claro.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#finance' });
    await sleep(2500);
    await client.eval(`document.documentElement.classList.remove('dark');`);
    await client.captureScreenshot('03-financeiro-claro.png');

    // 4. 04-contabilidade-claro.png (Contabilidade)
    console.log('4. Capturando 04-contabilidade-claro.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#accounting' });
    await sleep(2500);
    await client.eval(`document.documentElement.classList.remove('dark');`);
    await client.captureScreenshot('04-contabilidade-claro.png');

    // 5. 05-marketing-claro.png (Marketing)
    console.log('5. Capturando 05-marketing-claro.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#marketing' });
    await sleep(2500);
    await client.eval(`document.documentElement.classList.remove('dark');`);
    await client.captureScreenshot('05-marketing-claro.png');

    // 6. 06-sac-claro.png (Atendimento SAC)
    console.log('6. Capturando 06-sac-claro.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#sac' });
    await sleep(2500);
    await client.eval(`document.documentElement.classList.remove('dark');`);
    await client.captureScreenshot('06-sac-claro.png');

    // 7. 07-menu-submenu-claro.png (Menu e submenus abertos)
    console.log('7. Capturando 07-menu-submenu-claro.png ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#events' });
    await sleep(2000);
    await client.eval(`
      document.documentElement.classList.remove('dark');
      // Click open accordion for Events and Commercial if present
      const buttons = Array.from(document.querySelectorAll('button'));
      const eventsBtn = buttons.find(b => b.textContent.includes('Eventos') && b.querySelector('svg'));
      if (eventsBtn) eventsBtn.click();
    `);
    await sleep(1500);
    await client.captureScreenshot('07-menu-submenu-claro.png');

    // 8. 08-mobile-claro.png (Mobile 390x844)
    console.log('8. Capturando 08-mobile-claro.png (390x844) ...');
    await client.setViewport(390, 844, true);
    await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
    await sleep(2500);
    await client.eval(`document.documentElement.classList.remove('dark');`);
    await client.captureScreenshot('08-mobile-claro.png');

    await client.close();
    console.log('\n--- Todas as 8 screenshots do Tema Claro foram geradas com sucesso! ---');
  } catch (err) {
    console.error('Erro na execução da captura:', err);
  } finally {
    try {
      chromeProcess.kill();
    } catch {}
  }
}

main().catch(console.error);
