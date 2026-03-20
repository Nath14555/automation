// ==UserScript==
// @name         Alibaba Message Bridge
// @namespace    automation-alibaba-bridge
// @version      1.0.0
// @description  Capture les messages vendeurs Alibaba et les envoie au webhook n8n
// @match        https://message.alibaba.com/*
// @match        https://msg.alibaba.com/*
// @match        https://messagemanager.alibaba.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @connect      *
// ==/UserScript==

(function () {
  'use strict';

  // ====================================================
  // CONFIGURATION - A MODIFIER AVANT UTILISATION
  // ====================================================
  const CONFIG = {
    // URL du webhook n8n (OBLIGATOIRE)
    WEBHOOK_URL: GM_getValue('webhook_url', 'https://ton-n8n.com/webhook/alibaba-ingest'),

    // Intervalle de scan en millisecondes (defaut: 10 secondes)
    SCAN_INTERVAL: GM_getValue('scan_interval', 10000),

    // Envoyer une notification navigateur pour chaque message capture
    NOTIFICATIONS: GM_getValue('notifications', true),

    // Mode debug (affiche les logs dans la console)
    DEBUG: GM_getValue('debug', false),
  };

  // Stockage des messages deja envoyes (evite les doublons)
  const sentMessages = new Set(JSON.parse(GM_getValue('sent_messages', '[]')));

  // ====================================================
  // PANNEAU DE CONFIGURATION UI
  // ====================================================
  function createConfigPanel() {
    const panel = document.createElement('div');
    panel.id = 'alibaba-bridge-panel';
    panel.innerHTML = `
      <div style="
        position: fixed; bottom: 20px; right: 20px; z-index: 99999;
        background: #1a1a2e; color: #eee; padding: 16px; border-radius: 12px;
        font-family: -apple-system, sans-serif; font-size: 13px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3); min-width: 300px;
        border: 1px solid #333;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <strong style="font-size: 14px;">Alibaba Bridge</strong>
          <div>
            <span id="bridge-status" style="
              display: inline-block; width: 10px; height: 10px;
              border-radius: 50%; background: #00c853; margin-right: 8px;
            "></span>
            <button id="bridge-toggle" style="
              background: none; border: 1px solid #555; color: #eee;
              padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;
            ">Pause</button>
            <button id="bridge-minimize" style="
              background: none; border: none; color: #888;
              cursor: pointer; font-size: 16px; margin-left: 4px;
            ">_</button>
          </div>
        </div>
        <div id="bridge-body">
          <div style="margin-bottom: 8px;">
            <label style="font-size: 11px; color: #aaa;">Webhook URL</label>
            <input id="bridge-webhook-url" type="text" value="${CONFIG.WEBHOOK_URL}" style="
              width: 100%; padding: 6px; background: #0f0f23; color: #eee;
              border: 1px solid #444; border-radius: 4px; font-size: 12px;
              margin-top: 2px; box-sizing: border-box;
            ">
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <div style="flex: 1;">
              <label style="font-size: 11px; color: #aaa;">Messages envoyes</label>
              <div id="bridge-count" style="font-size: 18px; font-weight: bold; color: #00c853;">0</div>
            </div>
            <div style="flex: 1;">
              <label style="font-size: 11px; color: #aaa;">Doublons ignores</label>
              <div id="bridge-duplicates" style="font-size: 18px; font-weight: bold; color: #ff9800;">0</div>
            </div>
          </div>
          <div id="bridge-log" style="
            max-height: 120px; overflow-y: auto; font-size: 11px;
            background: #0f0f23; padding: 8px; border-radius: 4px;
            border: 1px solid #333; color: #aaa;
          ">En attente de messages...</div>
          <button id="bridge-save-config" style="
            width: 100%; margin-top: 8px; padding: 6px;
            background: #1976d2; color: white; border: none;
            border-radius: 4px; cursor: pointer; font-size: 12px;
          ">Sauvegarder config</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Event listeners
    document.getElementById('bridge-save-config').addEventListener('click', () => {
      const url = document.getElementById('bridge-webhook-url').value;
      GM_setValue('webhook_url', url);
      CONFIG.WEBHOOK_URL = url;
      addLog('Config sauvegardee');
    });

    document.getElementById('bridge-toggle').addEventListener('click', () => {
      bridgeActive = !bridgeActive;
      const btn = document.getElementById('bridge-toggle');
      const status = document.getElementById('bridge-status');
      btn.textContent = bridgeActive ? 'Pause' : 'Activer';
      status.style.background = bridgeActive ? '#00c853' : '#ff5252';
      addLog(bridgeActive ? 'Bridge active' : 'Bridge en pause');
    });

    let minimized = false;
    document.getElementById('bridge-minimize').addEventListener('click', () => {
      minimized = !minimized;
      document.getElementById('bridge-body').style.display = minimized ? 'none' : 'block';
      document.getElementById('bridge-minimize').textContent = minimized ? '+' : '_';
    });
  }

  let messageCount = 0;
  let duplicateCount = 0;
  let bridgeActive = true;

  function addLog(text) {
    const log = document.getElementById('bridge-log');
    if (!log) return;
    const time = new Date().toLocaleTimeString('fr-FR');
    log.innerHTML = `<div>[${time}] ${text}</div>` + log.innerHTML;
    // Garder max 50 lignes
    const lines = log.querySelectorAll('div');
    if (lines.length > 50) {
      for (let i = 50; i < lines.length; i++) lines[i].remove();
    }
  }

  function updateCounters() {
    const countEl = document.getElementById('bridge-count');
    const dupEl = document.getElementById('bridge-duplicates');
    if (countEl) countEl.textContent = messageCount;
    if (dupEl) dupEl.textContent = duplicateCount;
  }

  // ====================================================
  // EXTRACTION DES MESSAGES
  // ====================================================

  // Selecteurs CSS pour les elements de message Alibaba
  // (adaptes aux differentes versions de l'interface)
  const SELECTORS = {
    // Conteneur de la liste de messages
    messageList: [
      '.message-list',
      '.msg-list',
      '.chat-message-list',
      '[class*="messageList"]',
      '[class*="chat-content"]',
      '.im-message-list',
    ],
    // Elements de message individuels
    messageItem: [
      '.message-item',
      '.msg-item',
      '.chat-message-item',
      '[class*="messageItem"]',
      '[class*="chat-msg"]',
      '.im-message-item',
    ],
    // Contenu du message
    messageContent: [
      '.message-content',
      '.msg-content',
      '.chat-message-text',
      '[class*="msgContent"]',
      '[class*="message-text"]',
      '.im-message-content',
      '.text-content',
    ],
    // Nom du vendeur
    sellerName: [
      '.contact-name',
      '.sender-name',
      '.chat-user-name',
      '[class*="contactName"]',
      '[class*="userName"]',
      '.im-contact-name',
    ],
    // Liste de contacts/conversations
    contactList: [
      '.contact-list',
      '.conversation-list',
      '[class*="contactList"]',
      '[class*="sessionList"]',
      '.im-session-list',
    ],
    // Contact actif
    activeContact: [
      '.contact-item.active',
      '.conversation-item.active',
      '[class*="contactItem"][class*="active"]',
      '[class*="sessionItem"][class*="active"]',
      '[class*="selected"]',
    ],
  };

  function querySelector(selectorList) {
    for (const selector of selectorList) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function querySelectorAll(selectorList) {
    for (const selector of selectorList) {
      const els = document.querySelectorAll(selector);
      if (els.length > 0) return els;
    }
    return [];
  }

  function extractSellerInfo() {
    // Essaye d'extraire les infos du vendeur actif
    const activeContact = querySelector(SELECTORS.activeContact);
    const sellerNameEl = querySelector(SELECTORS.sellerName);

    let sellerName = 'Unknown Seller';
    let sellerId = 'unknown';

    if (sellerNameEl) {
      sellerName = sellerNameEl.textContent.trim();
    } else if (activeContact) {
      sellerName = activeContact.textContent.trim().split('\n')[0];
    }

    // Essaye de trouver l'ID vendeur dans l'URL ou les attributs
    const urlMatch = window.location.href.match(/(?:contact|seller|user)[_-]?id[=:](\w+)/i);
    if (urlMatch) {
      sellerId = urlMatch[1];
    } else {
      // Genere un ID stable a partir du nom
      sellerId = 'ali_' + sellerName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
    }

    return { sellerName, sellerId };
  }

  function extractProductInfo() {
    // Cherche des infos produit dans la page
    const productInfo = {
      product_name: '',
      product_url: '',
      price: null,
      moq: null,
    };

    // Cherche un lien produit dans la conversation
    const productLinks = document.querySelectorAll('a[href*="alibaba.com/product"], a[href*="detail"]');
    if (productLinks.length > 0) {
      const lastLink = productLinks[productLinks.length - 1];
      productInfo.product_url = lastLink.href;
      productInfo.product_name = lastLink.textContent.trim() || '';
    }

    return productInfo;
  }

  function extractMessages() {
    const messages = [];
    const messageEls = querySelectorAll(SELECTORS.messageItem);
    const seller = extractSellerInfo();
    const product = extractProductInfo();

    messageEls.forEach((el, index) => {
      const contentEl = el.querySelector(
        SELECTORS.messageContent.join(',')
      );

      if (!contentEl) return;

      const text = contentEl.textContent.trim();
      if (!text) return;

      // Determine si c'est un message du vendeur (pas de nous)
      const isSent = el.classList.contains('sent') ||
        el.classList.contains('self') ||
        el.classList.contains('mine') ||
        el.getAttribute('data-role') === 'self' ||
        el.querySelector('[class*="self"]') !== null ||
        el.querySelector('[class*="mine"]') !== null;

      if (isSent) return; // Ignore nos propres messages

      // Cree un ID unique base sur le contenu et la position
      const messageId = `ali_${btoa(unescape(encodeURIComponent(text.substring(0, 50)))).substring(0, 20)}_${index}`;

      messages.push({
        message_id: messageId,
        seller_id: seller.sellerId,
        seller_name: seller.sellerName,
        message: text,
        product_name: product.product_name,
        product_url: product.product_url,
        price: product.price,
        moq: product.moq,
        timestamp: new Date().toISOString(),
      });
    });

    return messages;
  }

  // ====================================================
  // ENVOI AU WEBHOOK
  // ====================================================

  function sendToWebhook(messageData) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'POST',
        url: CONFIG.WEBHOOK_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(messageData),
        onload: function (response) {
          if (response.status >= 200 && response.status < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${response.status}: ${response.responseText}`));
          }
        },
        onerror: function (error) {
          reject(error);
        },
      });
    });
  }

  async function processNewMessages() {
    if (!bridgeActive) return;

    const messages = extractMessages();

    for (const msg of messages) {
      if (sentMessages.has(msg.message_id)) {
        continue;
      }

      try {
        await sendToWebhook(msg);

        sentMessages.add(msg.message_id);
        messageCount++;

        // Persist sent messages (garder les 500 derniers)
        const sentArray = Array.from(sentMessages);
        if (sentArray.length > 500) {
          sentArray.splice(0, sentArray.length - 500);
          sentMessages.clear();
          sentArray.forEach(id => sentMessages.add(id));
        }
        GM_setValue('sent_messages', JSON.stringify(sentArray));

        addLog(`Envoye: "${msg.message.substring(0, 40)}..." de ${msg.seller_name}`);
        updateCounters();

        if (CONFIG.NOTIFICATIONS) {
          GM_notification({
            title: 'Alibaba Bridge',
            text: `Message de ${msg.seller_name} envoye au webhook`,
            timeout: 3000,
          });
        }

        if (CONFIG.DEBUG) {
          console.log('[Alibaba Bridge] Sent:', msg);
        }
      } catch (err) {
        addLog(`Erreur: ${err.message}`);
        console.error('[Alibaba Bridge] Error:', err);
      }
    }
  }

  // ====================================================
  // OBSERVATION DES CHANGEMENTS DOM (messages en temps reel)
  // ====================================================

  function setupMutationObserver() {
    const chatContainer = querySelector(SELECTORS.messageList);

    if (chatContainer) {
      const observer = new MutationObserver((mutations) => {
        // Un nouveau noeud a ete ajoute = potentiellement un nouveau message
        const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
        if (hasNewNodes) {
          // Petit delai pour laisser le DOM se stabiliser
          setTimeout(processNewMessages, 500);
        }
      });

      observer.observe(chatContainer, {
        childList: true,
        subtree: true,
      });

      addLog('Observation DOM activee');
      return true;
    }

    return false;
  }

  // ====================================================
  // INITIALISATION
  // ====================================================

  function init() {
    createConfigPanel();
    addLog('Bridge initialise');

    // Essaye de configurer l'observateur DOM
    let observerSetup = setupMutationObserver();

    // Re-essaye si le DOM n'est pas encore pret
    if (!observerSetup) {
      const retryInterval = setInterval(() => {
        observerSetup = setupMutationObserver();
        if (observerSetup) {
          clearInterval(retryInterval);
        }
      }, 2000);

      // Arrete les tentatives apres 30 secondes
      setTimeout(() => clearInterval(retryInterval), 30000);
    }

    // Scan periodique en complement de l'observateur DOM
    setInterval(processNewMessages, CONFIG.SCAN_INTERVAL);

    // Premier scan
    setTimeout(processNewMessages, 2000);
  }

  // Attendre que la page soit chargee
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();
