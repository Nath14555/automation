#!/usr/bin/env node

/**
 * Alibaba Email Bridge
 *
 * Surveille une boite email pour les notifications Alibaba
 * et forward les messages au webhook n8n.
 *
 * Pre-requis:
 *   - Activer les notifications email dans les parametres Alibaba
 *   - Si Gmail: creer un "App Password" (pas le mot de passe principal)
 *
 * Usage:
 *   1. cp .env.example .env && nano .env
 *   2. npm install
 *   3. npm run email-bridge
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

// Charger .env
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
  imap: {
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  },
  debug: process.env.DEBUG === 'true',
  processedPath: path.join(__dirname, '.processed-emails.json'),
};

if (!CONFIG.webhookUrl || !CONFIG.imap.user || !CONFIG.imap.password) {
  console.error('N8N_WEBHOOK_URL, IMAP_USER et IMAP_PASSWORD sont requis');
  process.exit(1);
}

// Emails deja traites
let processedEmails = new Set();
function loadProcessed() {
  if (fs.existsSync(CONFIG.processedPath)) {
    const data = JSON.parse(fs.readFileSync(CONFIG.processedPath, 'utf8'));
    processedEmails = new Set(data.slice(-2000));
  }
}
function saveProcessed() {
  const arr = Array.from(processedEmails);
  fs.writeFileSync(CONFIG.processedPath, JSON.stringify(arr.slice(-2000)));
}

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
}

// ====================================================
// PARSEUR DE MESSAGES ALIBABA
// ====================================================

// Patterns pour identifier les emails Alibaba
const ALIBABA_SENDERS = [
  /noreply@alibaba\.com/i,
  /notification@alibaba\.com/i,
  /message@alibaba\.com/i,
  /trade@alibaba\.com/i,
  /inquiry@alibaba\.com/i,
  /@alimail\.com/i,
  /alibaba/i,
];

function isAlibabaEmail(from) {
  return ALIBABA_SENDERS.some(pattern => pattern.test(from));
}

function parseAlibabaEmail(subject, textBody, htmlBody) {
  const body = textBody || htmlBody || '';

  // Extraire le nom du vendeur
  const sellerPatterns = [
    /(?:from|de|seller|supplier|fournisseur)\s*[:\s]*([^\n<]+)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:sent|a envoye|replied)/i,
    /(?:company|societe|entreprise)\s*[:\s]*([^\n<]+)/i,
  ];

  let sellerName = 'Unknown Seller';
  for (const pattern of sellerPatterns) {
    const match = body.match(pattern);
    if (match) {
      sellerName = match[1].trim();
      break;
    }
  }

  // Extraire le contenu du message
  const messagePatterns = [
    /(?:message|content|contenu)\s*[:\s]*\n?([\s\S]*?)(?:\n\n|---|-{3,}|Reply|Repondre|View)/i,
    /(?:wrote|a ecrit|dit)\s*[:\s]*\n?([\s\S]*?)(?:\n\n|---|-{3,}|Reply|Repondre)/i,
    /"([^"]{10,})"/g, // Contenu entre guillemets
  ];

  let messageContent = '';
  for (const pattern of messagePatterns) {
    const match = body.match(pattern);
    if (match) {
      messageContent = match[1].trim();
      break;
    }
  }

  // Si pas de contenu specifique trouve, utiliser le body nettoye
  if (!messageContent) {
    // Enlever les headers, footers, liens
    messageContent = body
      .replace(/https?:\/\/[^\s]+/g, '') // URLs
      .replace(/^.*(?:Dear|Hello|Hi|Cher|Bonjour).*$/im, '') // Salutations
      .replace(/^.*(?:Regards|Sincerely|Cordialement|Best).*$/im, '') // Signatures
      .replace(/^.*(?:unsubscribe|desabonner|privacy|confidentialite).*$/igm, '') // Footers
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .substring(0, 2000);
  }

  // Extraire les prix
  const priceMatch = body.match(/(?:USD|US\$|\$)\s*([0-9.,]+)/i);
  const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null;

  // Extraire le MOQ
  const moqMatch = body.match(/(?:MOQ|minimum\s*order|min\.?\s*order)\s*[:\s]*(\d+)/i);
  const moq = moqMatch ? parseInt(moqMatch[1]) : null;

  // Extraire le nom du produit depuis le sujet
  const productMatch = subject.match(/(?:Re:\s*)?(?:Inquiry|Question|About|Regarding)\s*(?:about|for|on)?\s*[:\-]?\s*(.+)/i);
  const productName = productMatch ? productMatch[1].trim() : '';

  // Extraire un lien produit
  const productUrlMatch = body.match(/(https?:\/\/[^\s]*alibaba\.com\/product[^\s]*)/i);
  const productUrl = productUrlMatch ? productUrlMatch[1] : '';

  return {
    seller_name: sellerName,
    seller_id: 'ali_email_' + sellerName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30),
    message: messageContent,
    product_name: productName,
    product_url: productUrl,
    price: price,
    moq: moq,
    original_subject: subject,
  };
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
    throw new Error(`Webhook ${response.status}: ${await response.text()}`);
  }
}

// ====================================================
// IMAP LISTENER
// ====================================================

function createImapConnection() {
  const imap = new Imap(CONFIG.imap);

  imap.on('ready', () => {
    log('Connecte au serveur IMAP');
    openInbox(imap);
  });

  imap.on('error', (err) => {
    log(`Erreur IMAP: ${err.message}`, 'ERROR');
    // Reconnexion apres 10 secondes
    setTimeout(() => {
      log('Tentative de reconnexion...');
      imap.connect();
    }, 10000);
  });

  imap.on('end', () => {
    log('Connexion IMAP fermee');
  });

  imap.on('mail', (numNewMsgs) => {
    log(`${numNewMsgs} nouveau(x) email(s) detecte(s)`);
    fetchNewEmails(imap);
  });

  return imap;
}

function openInbox(imap) {
  imap.openBox('INBOX', false, (err) => {
    if (err) {
      log(`Erreur ouverture INBOX: ${err.message}`, 'ERROR');
      return;
    }
    log('INBOX ouverte, en attente de nouveaux emails Alibaba...');

    // Scanner les emails recents au demarrage
    fetchNewEmails(imap);
  });
}

function fetchNewEmails(imap) {
  // Chercher les emails non lus des dernieres 24h
  const since = new Date();
  since.setDate(since.getDate() - 1);

  imap.search(['UNSEEN', ['SINCE', since]], (err, results) => {
    if (err) {
      log(`Erreur recherche: ${err.message}`, 'ERROR');
      return;
    }

    if (!results || results.length === 0) {
      if (CONFIG.debug) log('Aucun email non lu', 'DEBUG');
      return;
    }

    log(`${results.length} email(s) non lu(s) a traiter`);

    const fetch = imap.fetch(results, {
      bodies: '',
      markSeen: false, // Ne pas marquer comme lu automatiquement
    });

    fetch.on('message', (msg, seqno) => {
      let emailBuffer = '';

      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          emailBuffer += chunk.toString('utf8');
        });
      });

      msg.on('end', async () => {
        try {
          const parsed = await simpleParser(emailBuffer);
          const messageId = parsed.messageId || `seq_${seqno}_${Date.now()}`;

          // Skip si deja traite
          if (processedEmails.has(messageId)) return;

          const from = parsed.from?.text || '';

          // Verifier si c'est un email Alibaba
          if (!isAlibabaEmail(from)) {
            if (CONFIG.debug) log(`Ignore (pas Alibaba): ${from}`, 'DEBUG');
            return;
          }

          log(`Email Alibaba detecte: "${parsed.subject}" de ${from}`);

          // Parser le contenu
          const alibabaData = parseAlibabaEmail(
            parsed.subject || '',
            parsed.text || '',
            parsed.html || ''
          );

          // Skip si pas de contenu exploitable
          if (!alibabaData.message || alibabaData.message.length < 5) {
            log('Email ignore: pas de contenu message exploitable');
            return;
          }

          // Construire le payload
          const payload = {
            ...alibabaData,
            message_id: `ali_email_${messageId}`,
            timestamp: (parsed.date || new Date()).toISOString(),
            platform: 'email_forward',
            forwarded: true,
            from_email: from,
          };

          // Envoyer au webhook
          await sendToWebhook(payload);

          processedEmails.add(messageId);
          saveProcessed();

          log(`Envoye au webhook: "${alibabaData.message.substring(0, 50)}..." de ${alibabaData.seller_name}`);

          // Marquer comme lu
          imap.addFlags(seqno, ['\\Seen'], (err) => {
            if (err) log(`Erreur marquage lu: ${err.message}`, 'ERROR');
          });

        } catch (err) {
          log(`Erreur traitement email: ${err.message}`, 'ERROR');
        }
      });
    });

    fetch.on('error', (err) => {
      log(`Erreur fetch: ${err.message}`, 'ERROR');
    });
  });
}

// ====================================================
// MAIN
// ====================================================

function main() {
  log('=== Alibaba Email Bridge ===');
  log(`Webhook: ${CONFIG.webhookUrl}`);
  log(`IMAP: ${CONFIG.imap.user}@${CONFIG.imap.host}`);

  loadProcessed();
  log(`${processedEmails.size} emails precedemment traites en cache`);

  const imap = createImapConnection();
  imap.connect();

  // Gestion arret propre
  const cleanup = () => {
    log('Arret en cours...');
    saveProcessed();
    imap.end();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main();
