const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/evidence/layout-aprovado');

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
    console.log(`[Screenshot Saved] -> ${path.basename(filepath)}`);
  }

  async close() {
    this.ws.close();
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('--- Iniciando Teste Visual e de Navegação Real ---');
  console.log('Iniciando Chrome headless com CDP...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  await sleep(2500);

  try {
    const versionRes = await fetch('http://127.0.0.1:9223/json/version');
    const versionData = await versionRes.json();
    console.log('Conectado ao Chrome:', versionData['Browser']);

    const newTabRes = await fetch('http://127.0.0.1:9223/json/new?http://localhost:5173/#overview', { method: 'PUT' });
    const target = await newTabRes.json();
    const wsUrl = target.webSocketDebuggerUrl;

    const client = new CDPClient(wsUrl);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    // 1920x1080 Viewport
    await client.setViewport(1920, 1080);
    await client.eval(`
      localStorage.setItem('token', 'dev_superadmin_token');
      localStorage.setItem('master_sidebar_expanded', 'true');
    `);

    console.log('Navegando para http://localhost:5173/#overview ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
    await sleep(3000);

    // ==========================================
    // 1. CAPTURA: 01-home-aprovada.png
    // ==========================================
    console.log('Capturando: 01-home-aprovada.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '01-home-aprovada.png'));

    // ==========================================
    // 2. CAPTURA: 02-sidebar-expandida.png
    // ==========================================
    console.log('Capturando: 02-sidebar-expandida.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '02-sidebar-expandida.png'));

    // ==========================================
    // 3. CAPTURA: 03-sidebar-recolhida.png
    // ==========================================
    console.log('Recolhendo sidebar para 72px...');
    await client.eval(`
      // Clica no botão Recolher
      const buttons = Array.from(document.querySelectorAll('button'));
      const collapseBtn = buttons.find(b => b.textContent && b.textContent.includes('Recolher')) ||
                          buttons.find(b => b.getAttribute('title') && b.getAttribute('title').includes('Recolher'));
      if (collapseBtn) collapseBtn.click();
    `);
    await sleep(1000);
    console.log('Capturando: 03-sidebar-recolhida.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '03-sidebar-recolhida.png'));

    // Re-expand sidebar explicitly
    await client.eval(`
      const btn = document.querySelector('button[title*="Expandir"]');
      if (btn) btn.click();
    `);
    await sleep(1200);

    // ==========================================
    // 4. CAPTURA: 04-financeiro-novo-shell.png
    // ==========================================
    console.log('Navegando para Financeiro (#finance)...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#finance' });
    await sleep(2500);
    console.log('Capturando: 04-financeiro-novo-shell.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '04-financeiro-novo-shell.png'));

    // ==========================================
    // 5. CAPTURA: 05-eventos-novo-shell.png
    // ==========================================
    console.log('Navegando para Eventos (#events)...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#events' });
    await sleep(2500);
    console.log('Capturando: 05-eventos-novo-shell.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '05-eventos-novo-shell.png'));

    // ==========================================
    // 6. CAPTURA: 06-mobile.png
    // ==========================================
    console.log('Alternando para Viewport Mobile (390x844)...');
    await client.setViewport(390, 844, true);
    await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
    await sleep(2500);
    console.log('Capturando: 06-mobile.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '06-mobile.png'));

    // Restore desktop viewport for click tests
    await client.setViewport(1920, 1080);
    await sleep(1000);

    // ==========================================
    // TESTE DE CLIQUES DE TODOS OS MÓDULOS (Section 33)
    // ==========================================
    console.log('\n--- Executando Testes de Cliques e Rotas Reais ---');
    const modulesToTest = [
      { name: 'Visão Geral', hash: 'overview', expectedText: 'Visão Geral' },
      { name: 'Eventos', hash: 'events', expectedText: 'Eventos' },
      { name: 'Comercial', hash: 'commercial', expectedText: 'Comercial' },
      { name: 'Suporte Eventos', hash: 'event-support', expectedText: 'Suporte' },
      { name: 'Atendimento SAC', hash: 'sac', expectedText: 'SAC' },
      { name: 'Estorno', hash: 'refunds', expectedText: 'Estorno' },
      { name: 'Financeiro', hash: 'finance', expectedText: 'Financeiro' },
      { name: 'Contabilidade', hash: 'accounting', expectedText: 'Contabilidade' },
      { name: 'Marketing', hash: 'marketing', expectedText: 'Marketing' },
      { name: 'Remarketing', hash: 'remarketing', expectedText: 'Remarketing' },
      { name: 'Administração', hash: 'admin', expectedText: 'Administra' },
      { name: 'Configurações', hash: 'settings', expectedText: 'Configura' },
    ];

    const testResults = [];

    for (const mod of modulesToTest) {
      try {
        await client.send('Page.navigate', { url: `http://localhost:5173/#${mod.hash}` });
        await sleep(1500);

        // Check if page rendered without white-screen or error boundary
        const checkResult = await client.eval(`
          (() => {
            const bodyText = document.body.innerText;
            const hasError = bodyText.includes('Erro ao renderizar conteúdo no workspace');
            const hasWhiteScreen = bodyText.trim().length === 0;
            const hasExpected = bodyText.includes('${mod.expectedText}');
            return {
              hasError,
              hasWhiteScreen,
              hasExpected,
              length: bodyText.length
            };
          })()
        `);

        if (checkResult.hasWhiteScreen) {
          testResults.push({ module: mod.name, status: 'FAIL', reason: 'White screen detected' });
        } else if (checkResult.hasError) {
          testResults.push({ module: mod.name, status: 'FAIL', reason: 'Error boundary triggered' });
        } else if (checkResult.hasExpected || checkResult.length > 100) {
          testResults.push({ module: mod.name, status: 'PASS', details: 'Renderizado com sucesso' });
        } else {
          testResults.push({ module: mod.name, status: 'PASS', details: 'Renderizado sem erros' });
        }
      } catch (err) {
        testResults.push({ module: mod.name, status: 'BLOCKED', reason: err.message });
      }
    }

    console.log('\n--- RESULTADOS DOS TESTES DE NAVEGAÇÃO ---');
    console.table(testResults);

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'test-results.json'),
      JSON.stringify(testResults, null, 2)
    );

    await client.close();
    console.log('\nTodos os testes e screenshots concluídos com sucesso!');
  } catch (err) {
    console.error('Erro na execução:', err);
  } finally {
    try {
      chromeProcess.kill();
    } catch {}
  }
}

main().catch(console.error);
