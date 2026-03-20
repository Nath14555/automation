#!/usr/bin/env node

/**
 * Alibaba Puppeteer Bridge
 *
 * Se connecte a Alibaba Trade Manager via un navigateur headless,
 * surveille les nouveaux messages et les envoie au webhook n8n.
 *
 * Usage:
 *   1. cp .env.example .env && nano .env  (configurer les variables)
 *   2. npm install
 *   3. npm start
 *
 * Premiere connexion:
 *   Lancer avec HEADLESS=false pour se connecter manuellement
 *   et resoudre les captchas. Les cookies seront sauvegardes.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Charger .env manuellement (pas de dependance dotenv)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Fichier .env manquant. Copie .env.example vers .env et configure-le.');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const CONFIG = {
  webhookUrl: process.env.N8N_WEBHOOK_URL,
  email: process.env.ALIBABA_EMAIL,
  password: process.env.ALIBABA_PASSWORD,
  scanInterval: parseInt(process.env.SCAN_INTERVAL_MS || '30000', 10),
  headless: process.env.HEADLESS !== 'false',
  debug: process.env.DEBUG === 'true',
  cookiesPath: path.join(__dirname, '.cookies.json'),
  sentMessagesPath: path.join(__dirname, '.sent-messages.json'),
};

if (!CONFIG.webhookUrl) {
  console.error('N8N_WEBHOOK_URL est requis dans le fichier .env');
  process.exit(1);
}

// Stockage des messages deja envoyes
let sentMessages = new Set();
function loadSentMessages() {
  if (fs.existsSync(CONFIG.sentMessagesPath)) {
    const data = JSON.parse(fs.readFileSync(CONFIG.sentMessagesPath, 'utf8'));
    sentMessages = new Set(data.slice(-1000)); // Garder max 1000
  }
}
function saveSentMessages() {
  fs.writeFileSync(CONFIG.sentMessagesPath, JSON.stringify(Array.from(sentMessages)));
}

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
}

function debug(msg) {
  if (CONFIG.debug) log(msg, 'DEBUG');
}

// ====================================================
// ENVOI AU WEBHOOK
// ====================================================

async function sendToWebhook(data) {
  const response = await fetch(CONFIG.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status} ${await response.text()}`);
  }

  return response.json().catch(() => ({}));
}

// ====================================================
// NAVIGATEUR & CONNEXION
// ====================================================

async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: CONFIG.headless ? 'new' : false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1280,900',
    ],
    defaultViewport: { width: 1280, height: 900 },
  });

  return browser;
}

async function loadCookies(page) {
  if (fs.existsSync(CONFIG.cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(CONFIG.cookiesPath, 'utf8'));
    await page.setCookie(...cookies);
    log('Cookies charges');
    return true;
  }
  return false;
}

async function saveCookies(page) {
  const cookies = await page.cookies();
  fs.writeFileSync(CONFIG.cookiesPath, JSON.stringify(cookies, null, 2));
  debug('Cookies sauvegardes');
}

async function isLoggedIn(page) {
  try {
    // Verifier si on est sur une page connectee
    const url = page.url();
    if (url.includes('login') || url.includes('signin')) return false;

    // Chercher des elements qui indiquent une session active
    const loggedInIndicators = await page.evaluate(() => {
      const selectors = [
        '[class*="user-info"]',
        '[class*="account"]',
        '[class*="avatar"]',
        '.munb-user',
        '#alibaba-login-box',
      ];
      for (const sel of selectors) {
        if (document.querySelector(sel)) return sel;
      }
      return null;
    });

    return loggedInIndicators !== null && !url.includes('login');
  } catch {
    return false;
  }
}

async function login(page) {
  log('Connexion a Alibaba...');

  await page.goto('https://login.alibaba.com/', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // Si pas headless, attendre que l'utilisateur se connecte manuellement
  if (!CONFIG.headless) {
    log('MODE INTERACTIF: Connectez-vous manuellement dans le navigateur.');
    log('Le script detectera automatiquement quand vous etes connecte...');

    // Attendre jusqu'a 5 minutes
    let loginTimeout = 300000;
    const startTime = Date.now();

    while (Date.now() - startTime < loginTimeout) {
      await new Promise(r => setTimeout(r, 3000));

      const url = page.url();
      if (!url.includes('login') && !url.includes('signin')) {
        log('Connexion detectee');
        await saveCookies(page);
        return true;
      }
    }

    log('Timeout de connexion', 'ERROR');
    return false;
  }

  // Mode headless: connexion automatique
  if (!CONFIG.email || !CONFIG.password) {
    log('Email/password requis pour la connexion headless. Utilisez HEADLESS=false pour la premiere connexion.', 'ERROR');
    return false;
  }

  try {
    // Attendre le formulaire de login
    await page.waitForSelector('input[name="loginId"], input#fm-login-id', { timeout: 15000 });

    // Remplir email
    const emailInput = await page.$('input[name="loginId"], input#fm-login-id');
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(CONFIG.email, { delay: 50 });

    // Remplir mot de passe
    const passwordInput = await page.$('input[name="password"], input#fm-login-password');
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(CONFIG.password, { delay: 50 });

    // Cliquer sur le bouton de connexion
    const submitButton = await page.$('button[type="submit"], .fm-submit');
    if (submitButton) {
      await submitButton.click();
    }

    // Attendre la redirection post-login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    if (await isLoggedIn(page)) {
      log('Connexion reussie');
      await saveCookies(page);
      return true;
    }

    log('Connexion echouee - captcha probable. Relancez avec HEADLESS=false', 'ERROR');
    return false;
  } catch (err) {
    log(`Erreur de connexion: ${err.message}`, 'ERROR');
    return false;
  }
}

// ====================================================
// EXTRACTION DES MESSAGES
// ====================================================

async function navigateToMessages(page) {
  const messageUrl = 'https://message.alibaba.com/message/default.htm';
  const currentUrl = page.url();

  if (!currentUrl.includes('message.alibaba.com')) {
    log('Navigation vers la messagerie...');
    await page.goto(messageUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await new Promise(r => setTimeout(r, 3000));
  }
}

async function getConversationList(page) {
  return page.evaluate(() => {
    const conversations = [];
    const selectors = [
      '.contact-item', '.conversation-item',
      '[class*="contactItem"]', '[class*="sessionItem"]',
      '.im-session-item', '.msg-contact',
    ];

    let items = [];
    for (const sel of selectors) {
      items = document.querySelectorAll(sel);
      if (items.length > 0) break;
    }

    items.forEach(item => {
      const nameEl = item.querySelector(
        '.contact-name, .sender-name, [class*="contactName"], [class*="userName"]'
      );
      const previewEl = item.querySelector(
        '.last-message, .msg-preview, [class*="lastMsg"], [class*="preview"]'
      );
      const unreadEl = item.querySelector(
        '.unread-count, .badge, [class*="unread"], [class*="badge"]'
      );

      const name = nameEl ? nameEl.textContent.trim() : '';
      const preview = previewEl ? previewEl.textContent.trim() : '';
      const unread = unreadEl ? parseInt(unreadEl.textContent) || 0 : 0;

      if (name) {
        conversations.push({ name, preview, unread, element: null });
      }
    });

    return conversations;
  });
}

async function extractCurrentMessages(page) {
  return page.evaluate(() => {
    const messages = [];
    const msgSelectors = [
      '.message-item', '.msg-item', '.chat-message-item',
      '[class*="messageItem"]', '[class*="chat-msg"]',
      '.im-message-item',
    ];

    let items = [];
    for (const sel of msgSelectors) {
      items = document.querySelectorAll(sel);
      if (items.length > 0) break;
    }

    // Nom du contact actif
    const contactNameEl = document.querySelector(
      '.contact-name.active, .chat-header [class*="name"], [class*="chatTitle"]'
    );
    const sellerName = contactNameEl ? contactNameEl.textContent.trim() : 'Unknown';

    items.forEach((item, index) => {
      const contentSelectors = [
        '.message-content', '.msg-content', '.chat-message-text',
        '[class*="msgContent"]', '[class*="message-text"]',
        '.im-message-content', '.text-content',
      ];

      let contentEl = null;
      for (const sel of contentSelectors) {
        contentEl = item.querySelector(sel);
        if (contentEl) break;
      }

      if (!contentEl) return;

      const text = contentEl.textContent.trim();
      if (!text) return;

      // Verifier si c'est un message recu (pas envoye par nous)
      const isSent = item.classList.contains('sent') ||
        item.classList.contains('self') ||
        item.classList.contains('mine') ||
        item.getAttribute('data-role') === 'self';

      if (isSent) return;

      // Extraire le timestamp si disponible
      const timeEl = item.querySelector(
        '.message-time, .msg-time, [class*="time"], time'
      );
      const timeText = timeEl ? timeEl.textContent.trim() : '';

      messages.push({
        text,
        sellerName,
        index,
        time: timeText,
      });
    });

    return messages;
  });
}

// ====================================================
// BOUCLE PRINCIPALE
// ====================================================

async function scanForMessages(page) {
  try {
    await navigateToMessages(page);

    const rawMessages = await extractCurrentMessages(page);
    debug(`${rawMessages.length} messages trouves dans la conversation active`);

    for (const msg of rawMessages) {
      // Creer un ID unique
      const msgId = `ali_pup_${Buffer.from(msg.text.substring(0, 60)).toString('base64').substring(0, 30)}_${msg.index}`;

      if (sentMessages.has(msgId)) {
        continue;
      }

      // Construire le payload
      const payload = {
        seller_id: 'ali_' + msg.sellerName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30),
        seller_name: msg.sellerName,
        message: msg.text,
        message_id: msgId,
        timestamp: new Date().toISOString(),
        platform: 'trade_manager',
      };

      try {
        await sendToWebhook(payload);
        sentMessages.add(msgId);
        saveSentMessages();
        log(`Message envoye: "${msg.text.substring(0, 50)}..." de ${msg.sellerName}`);
      } catch (err) {
        log(`Erreur webhook: ${err.message}`, 'ERROR');
      }
    }

    // Verifier les conversations non lues
    const conversations = await getConversationList(page);
    const unreadConvos = conversations.filter(c => c.unread > 0);

    if (unreadConvos.length > 0) {
      log(`${unreadConvos.length} conversation(s) non lue(s): ${unreadConvos.map(c => c.name).join(', ')}`);
    }

  } catch (err) {
    log(`Erreur de scan: ${err.message}`, 'ERROR');
    debug(err.stack);
  }
}

async function main() {
  log('=== Alibaba Puppeteer Bridge ===');
  log(`Webhook: ${CONFIG.webhookUrl}`);
  log(`Intervalle: ${CONFIG.scanInterval / 1000}s`);
  log(`Mode: ${CONFIG.headless ? 'headless' : 'interactif'}`);

  loadSentMessages();
  log(`${sentMessages.size} messages precedemment envoyes en cache`);

  const browser = await launchBrowser();
  const page = await browser.newPage();

  // User-agent realiste
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  // Charger les cookies si disponibles
  const hasCookies = await loadCookies(page);

  // Naviguer vers Alibaba
  await page.goto('https://www.alibaba.com/', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // Verifier si connecte
  if (!(await isLoggedIn(page))) {
    if (hasCookies) {
      log('Cookies expires, reconnexion necessaire');
    }
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      await browser.close();
      process.exit(1);
    }
  } else {
    log('Session active (via cookies)');
  }

  // Boucle de scan
  log('Demarrage du scan des messages...');

  const scan = async () => {
    await scanForMessages(page);
  };

  await scan(); // Premier scan immediat
  setInterval(scan, CONFIG.scanInterval);

  // Gestion de l'arret propre
  const cleanup = async () => {
    log('Arret en cours...');
    saveSentMessages();
    await browser.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch(err => {
  log(`Erreur fatale: ${err.message}`, 'ERROR');
  console.error(err);
  process.exit(1);
});
