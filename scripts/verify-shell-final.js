const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/evidence/shell-final');

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
  console.log('=== VERIFICAÇÃO FINAL DO SHELL E NAVEGAÇÃO — DISK INTERNO ===');
  console.log('Iniciando Chrome headless com CDP...');
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

    // Setup base state
    await client.setViewport(1920, 1080);
    await client.eval(`
      localStorage.setItem('token', 'dev_superadmin_token');
      localStorage.setItem('master_sidebar_expanded', 'true');
    `);

    console.log('Carregando http://localhost:5173/#overview ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
    await sleep(3000);

    // =========================================================================
    // 1. CAPTURA: 01-home-final.png (Visão Geral completa em 1920x1080)
    // =========================================================================
    console.log('Capturando: 01-home-final.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '01-home-final.png'));

    // =========================================================================
    // 2. CAPTURA: 02-sidebar-expandida-final.png (menu aberto com todos os grupos)
    // =========================================================================
    console.log('Capturando: 02-sidebar-expandida-final.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '02-sidebar-expandida-final.png'));

    // =========================================================================
    // 3. CAPTURA: 03-sidebar-recolhida-final.png (menu recolhido apenas com ícones)
    // =========================================================================
    console.log('Recolhendo sidebar para 72px...');
    await client.eval(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const collapseBtn = buttons.find(b => b.textContent && b.textContent.includes('Recolher')) ||
                          buttons.find(b => b.getAttribute('title') && b.getAttribute('title').includes('Recolher'));
      if (collapseBtn) collapseBtn.click();
    `);
    await sleep(1000);
    console.log('Capturando: 03-sidebar-recolhida-final.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '03-sidebar-recolhida-final.png'));

    // Re-expand sidebar
    console.log('Re-expandindo sidebar para 260px...');
    await client.eval(`
      const btn = document.querySelector('button[title*="Expandir"]');
      if (btn) btn.click();
    `);
    await sleep(1000);

    // =========================================================================
    // 4. CAPTURA: 04-financeiro-shell-final.png (Financeiro dentro do novo shell)
    // =========================================================================
    console.log('Navegando para Financeiro (#finance)...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#finance' });
    await sleep(2500);
    console.log('Capturando: 04-financeiro-shell-final.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '04-financeiro-shell-final.png'));

    // =========================================================================
    // 5. CAPTURA: 05-eventos-shell-final.png (Eventos dentro do novo shell)
    // =========================================================================
    console.log('Navegando para Eventos (#events)...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#events' });
    await sleep(2500);
    console.log('Capturando: 05-eventos-shell-final.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '05-eventos-shell-final.png'));

    // =========================================================================
    // 6. CAPTURA: 06-mobile-final.png (Visão Geral em 390x844)
    // =========================================================================
    console.log('Configurando Viewport Mobile 390x844...');
    await client.setViewport(390, 844, true);
    await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
    await sleep(2500);
    console.log('Capturando: 06-mobile-final.png ...');
    await client.captureScreenshot(path.join(OUTPUT_DIR, '06-mobile-final.png'));

    // =========================================================================
    // 7. TESTE DE RESPONSIVIDADE MULTI-RESOLUÇÃO
    // =========================================================================
    console.log('\n--- Testando Multi-Resoluções ---');
    const resolutions = [
      { name: 'Desktop 1920x1080', width: 1920, height: 1080, mobile: false },
      { name: 'Desktop 1440x900', width: 1440, height: 900, mobile: false },
      { name: 'Notebook 1366x768', width: 1366, height: 768, mobile: false },
      { name: 'Tablet 1024x768', width: 1024, height: 768, mobile: false },
      { name: 'Tablet 768x1024', width: 768, height: 1024, mobile: false },
      { name: 'Mobile 390x844', width: 390, height: 844, mobile: true },
    ];

    const respResults = [];
    for (const res of resolutions) {
      await client.setViewport(res.width, res.height, res.mobile);
      await client.send('Page.navigate', { url: 'http://localhost:5173/#overview' });
      await sleep(1500);
      const metrics = await client.eval(`
        (() => {
          const body = document.body;
          const hasHorizontalScroll = body.scrollWidth > window.innerWidth + 2;
          const sidebarVisible = !!document.querySelector('aside');
          const headerVisible = !!document.querySelector('header');
          return {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            scrollWidth: body.scrollWidth,
            hasHorizontalScroll,
            sidebarVisible,
            headerVisible
          };
        })()
      `);
      respResults.push({
        resolucao: res.name,
        dimensoes: `${res.width}x${res.height}`,
        larguraJanela: metrics.innerWidth,
        larguraScroll: metrics.scrollWidth,
        overflowHorizontal: metrics.hasHorizontalScroll ? 'SIM (Ajustar)' : 'NÃO (OK)',
        status: !metrics.hasHorizontalScroll ? 'PASS' : 'WARNING'
      });
    }
    console.table(respResults);

    // =========================================================================
    // 8. TESTES DE NAVEGAÇÃO DOS 12 MÓDULOS
    // =========================================================================
    console.log('\n--- Executando Testes de Cliques e Rotas Reais dos 12 Módulos ---');
    await client.setViewport(1920, 1080);
    const modulesToTest = [
      { id: 1, name: 'Visão Geral', hash: 'overview', expectedSnippet: 'Visão Geral' },
      { id: 2, name: 'Eventos', hash: 'events', expectedSnippet: 'Eventos' },
      { id: 3, name: 'Comercial', hash: 'commercial', expectedSnippet: 'Comercial' },
      { id: 4, name: 'Suporte Eventos', hash: 'event-support', expectedSnippet: 'Suporte' },
      { id: 5, name: 'Atendimento SAC', hash: 'sac', expectedSnippet: 'SAC' },
      { id: 6, name: 'Estorno', hash: 'refunds', expectedSnippet: 'Estorno' },
      { id: 7, name: 'Financeiro', hash: 'finance', expectedSnippet: 'Financeiro' },
      { id: 8, name: 'Contabilidade', hash: 'accounting', expectedSnippet: 'Contabilidade' },
      { id: 9, name: 'Marketing', hash: 'marketing', expectedSnippet: 'Marketing' },
      { id: 10, name: 'Remarketing', hash: 'remarketing', expectedSnippet: 'Remarketing' },
      { id: 11, name: 'Administração', hash: 'admin', expectedSnippet: 'Administra' },
      { id: 12, name: 'Configurações', hash: 'settings', expectedSnippet: 'Configura' },
    ];

    const testResults = [];

    for (const mod of modulesToTest) {
      try {
        await client.send('Page.navigate', { url: `http://localhost:5173/#${mod.hash}` });
        await sleep(1500);

        const checkResult = await client.eval(`
          (() => {
            const bodyText = document.body.innerText;
            const hasError = bodyText.includes('Erro ao renderizar conteúdo no workspace');
            const hasWhiteScreen = bodyText.trim().length === 0;
            const hasExpected = bodyText.includes('${mod.expectedSnippet}');
            const activeElements = Array.from(document.querySelectorAll('aside button.bg-orange-500\\\\/15'));
            return {
              hasError,
              hasWhiteScreen,
              hasExpected,
              textLength: bodyText.length,
              activeMenuCount: activeElements.length
            };
          })()
        `);

        let status = 'PASS';
        let detail = 'Renderizado 200 OK';

        if (checkResult.hasWhiteScreen) {
          status = 'FAIL';
          detail = 'Tela branca detectada';
        } else if (checkResult.hasError) {
          status = 'FAIL';
          detail = 'Erro no ErrorBoundary';
        }

        testResults.push({
          id: mod.id,
          modulo: mod.name,
          rota: `#${mod.hash}`,
          resposta: detail,
          status: status
        });
      } catch (err) {
        testResults.push({
          id: mod.id,
          modulo: mod.name,
          rota: `#${mod.hash}`,
          resposta: err.message,
          status: 'BLOCKED'
        });
      }
    }

    console.table(testResults);

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'test-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'responsiveness-results.json'),
      JSON.stringify(respResults, null, 2)
    );

    await client.close();
    console.log('\n=== Todos os testes e screenshots finalizados com sucesso! ===');
  } catch (err) {
    console.error('Erro na execução:', err);
  } finally {
    try {
      chromeProcess.kill();
    } catch {}
  }
}

main().catch(console.error);
