import { chromium } from 'playwright';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// 1. Inicialização do Firebase Admin (Acesso seguro ao banco de dados)
// O GitHub Actions injetará as credenciais via Variáveis de Ambiente
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('ERRO CRÍTICO: FIREBASE_SERVICE_ACCOUNT não configurado.');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const USER_UID = process.env.USER_UID; // O seu ID de utilizador no Firebase

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

    // Função auxiliar para enviar telemetria em tempo real
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
    const context = await browser.newContext();
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
    
    // Aguarda a navegação após o login
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    await log('Login bem-sucedido. Acesso concedido.', 'success', 50);

    // Selecionar a unidade
    await log('Localizando seletor de unidade...', 'info', 55);
    await page.waitForSelector('#select2-franquiaSelecionadaId-container');
    await page.click('#select2-franquiaSelecionadaId-container');

    await log('Selecionando a unidade: ADMINISTRAÇÃO', 'info', 60);
    // Clica na opção que contém o texto ADMINISTRAÇÃO
    await page.locator('.select2-results__option', { hasText: 'ADMINISTRAÇÃO' }).click();
    
    // Aguarda um pouco para a interface atualizar após a seleção
    await page.waitForTimeout(2000);
    await log('Unidade "ADMINISTRAÇÃO" selecionada com sucesso.', 'success', 65);

    // Navegação pelos menus
    const menus = [
      'Home', 'Atendimento', 'Cadastros', 'Comercial', 
      'Configurações', 'Estoque', 'Financeiro', 'Franqueadora', 
      'Marketing', 'Relatórios'
    ];

    let currentProgress = 65;
    const progressStep = 30 / menus.length; // Distribui os 30% restantes pelos menus

    for (const menu of menus) {
      await log(`Acessando menu: ${menu}`, 'info', Math.round(currentProgress));
      
      // Clica no link do menu usando o atributo data-item que me forneceu
      // Se for a Home, o seletor é um pouco diferente, mas vamos tentar o padrão primeiro
      try {
        if (menu === 'Home') {
          await page.locator('span.nav-text', { hasText: 'Home' }).first().click();
        } else {
          await page.click(`li.nav-item[data-item="${menu}"] > a`);
        }
        // Aguarda 2 segundos para simular a leitura/carregamento da página
        await page.waitForTimeout(2000);
      } catch (e) {
        await log(`Aviso: Não foi possível clicar no menu ${menu}.`, 'warning');
      }
      
      currentProgress += progressStep;
    }

    await log('Navegação concluída. (A extração de relatórios será implementada na próxima fase).', 'info', 95);

    // 5. A Autodestruição (O Fim da Missão)
    await log('Iniciando sequência de autodestruição. Apagando rastos.', 'warning', 98);
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
      // Tenta enviar o erro para o painel
      await db.collection('logs').add({
        missionId: missionRef.id,
        message: `ERRO CRÍTICO (Fail-Gracefully): ${error.message}`,
        level: 'error',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ownerId: USER_UID
      });
    }
    if (browser) await browser.close();
    process.exit(1); // Falha a action do GitHub
  }
}

run();
