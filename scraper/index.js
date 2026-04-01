import { chromium } from 'playwright';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// 1. Inicialização do Firebase Admin (Acesso seguro ao banco de dados e storage)
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('ERRO CRÍTICO: FIREBASE_SERVICE_ACCOUNT não configurado.');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gen-lang-client-0491037568.firebasestorage.app'
});

const db = getFirestore(app, 'ai-studio-c42bff15-6d0a-4ab8-b4fc-0493373678f2');
const bucket = admin.storage().bucket();
const USER_UID = process.env.USER_UID;

if (!USER_UID) {
  console.error('ERRO CRÍTICO: USER_UID não configurado.');
  process.exit(1);
}

async function run() {
  let missionRef;
  let browser;

  try {
    // 2. O Despertar: Criar a missão no banco de dados
    missionRef = await db.collection('missions').add({
      status: 'running',
      progress: 0,
      target: 'https://botopremium.spasolutions.com.br/Login',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ownerId: USER_UID
    });

    const log = async (msg, level = 'info', progress = null) => {
      console.log(`[${level.toUpperCase()}] ${msg}`);
      
      await db.collection('logs').add({
        missionId: missionRef.id,
        message: msg,
        level,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ownerId: USER_UID
      });

      if (progress !== null) {
        await missionRef.update({ 
          progress, 
          updatedAt: admin.firestore.FieldValue.serverTimestamp() 
        });
      }
    };

    await log('O Despertar: Operário digital iniciado na nuvem.', 'info', 5);

    // 3. A Criação do Ambiente ("A Sala Limpa")
    await log('Criando ambiente limpo. Iniciando navegador invisível (Headless Chromium).', 'info', 10);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    // 4. A Execução (A Caminhada Espacial)
    await log('Navegando para o portal de login...', 'info', 20);
    await page.goto('https://botopremium.spasolutions.com.br/Login', { waitUntil: 'networkidle' });

    await log('Injetando credenciais de acesso de forma segura...', 'info', 30);
    const login = process.env.TARGET_LOGIN || 'I857';
    const password = process.env.TARGET_PASSWORD || 'bp1234';
    
    await page.fill('#Login', login);
    await page.fill('#Senha', password);

    await log('Efetuando login...', 'info', 40);
    await page.click('#btnLogin');
    
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    await log('Login bem-sucedido. Acesso concedido.', 'success', 50);

    // Selecionar a unidade
    await log('Localizando seletor de unidade...', 'info', 55);
    await page.waitForSelector('#select2-franquiaSelecionadaId-container');
    await page.click('#select2-franquiaSelecionadaId-container');

    await log('Selecionando a unidade: ADMINISTRAÇÃO', 'info', 60);
    await page.locator('.select2-results__option', { hasText: 'ADMINISTRAÇÃO' }).click();
    
    await page.waitForTimeout(2000);
    await log('Unidade "ADMINISTRAÇÃO" selecionada com sucesso.', 'success', 65);

    // Navegação para Atendimento > Vendas
    await log('Acessando menu: Atendimento', 'info', 70);
    await page.click('li.nav-item[data-item="Atendimento"] > a');
    await page.waitForTimeout(1000);

    await log('Acessando submenu: Vendas', 'info', 75);
    await page.locator('span.item-name', { hasText: 'Vendas' }).click();
    await page.waitForLoadState('networkidle');

    // Preencher filtro de data
    await log('Configurando filtro de período (Data Início: 01/01/2025)...', 'info', 80);
    await page.waitForSelector('#DataInicio');
    // Preenche a data no formato YYYY-MM-DD exigido pelo input type="date"
    await page.fill('#DataInicio', '2025-01-01');

    await log('Executando pesquisa...', 'info', 85);
    await page.click('#btnPesquisar');
    
    // Aguardar a tabela carregar os dados
    await page.waitForTimeout(3000); // Espera a requisição AJAX da tabela terminar

    // Fazer o download do Excel
    await log('Iniciando extração de dados (Download Excel)...', 'info', 90);
    
    // Aguarda o evento de download enquanto clica no botão do Excel
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('svg.fa-file-excel').click()
    ]);

    const downloadPath = await download.path();
    const originalFileName = download.suggestedFilename();
    await log(`Arquivo recebido: ${originalFileName}. Preparando upload para a nuvem...`, 'info', 95);

    // Upload para o Firebase Storage
    const destinationPath = `downloads/${missionRef.id}/${originalFileName}`;
    await bucket.upload(downloadPath, {
      destination: destinationPath,
      metadata: {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    });

    // Obter URL assinada para download no painel (válida por 7 dias)
    const [url] = await bucket.file(destinationPath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    const stats = fs.statSync(downloadPath);
    const fileSizeInBytes = stats.size;

    // Salvar metadados do arquivo no Firestore para o painel exibir
    await db.collection('files').add({
      missionId: missionRef.id,
      name: originalFileName,
      url: url,
      size: fileSizeInBytes,
      category: 'Vendas',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ownerId: USER_UID,
      path: destinationPath
    });

    await log(`Upload concluído com sucesso! Arquivo disponível no painel.`, 'success', 98);

    // 5. A Autodestruição (O Fim da Missão)
    await log('Iniciando sequência de autodestruição. Apagando rastos.', 'warning', 99);
    await browser.close();

    await missionRef.update({ 
      status: 'completed', 
      progress: 100, 
      updatedAt: admin.firestore.FieldValue.serverTimestamp() 
    });
    
    await log('Missão Cumprida. Operário digital encerrado.', 'success');

  } catch (error) {
    console.error(error);
    if (missionRef) {
      await missionRef.update({ 
        status: 'failed', 
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
      await db.collection('logs').add({
        missionId: missionRef.id,
        message: `ERRO CRÍTICO (Fail-Gracefully): ${error.message}`,
        level: 'error',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ownerId: USER_UID
      });
    }
    if (browser) await browser.close();
    process.exit(1);
  }
}

run();
