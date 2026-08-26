const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode-terminal');
const pino = require('pino')({ level: 'silent' });

const app = express();
app.use(express.json());

let sock = null;
let qrCode = null;
let isConnected = false;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('whatsapp-auth');

  sock = makeWASocket({
    auth: state,
    logger: pino,
    printQRInTerminal: true,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCode = qr;
      console.log('📱 امسح QR Code بالهاتف:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) connectToWhatsApp();
    } else if (connection === 'open') {
      isConnected = true;
      qrCode = null;
      console.log('✅ واتساب متصل!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

app.get('/status', (req, res) => {
  res.json({ connected: isConnected, hasQr: !!qrCode });
});

app.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'Phone and message required' });
  }
  if (!isConnected) {
    return res.status(503).json({ success: false, error: 'WhatsApp not connected' });
  }
  try {
    const chatId = phone.replace(/\D/g, '') + '@s.whatsapp.net';
    await sock.sendMessage(chatId, { text: message });
    res.json({ success: true });
  } catch (err) {
    console.error('Send error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/send-image', async (req, res) => {
  const { phone, message, imageUrl } = req.body;
  if (!phone || !imageUrl) {
    return res.status(400).json({ success: false, error: 'Phone and imageUrl required' });
  }
  if (!isConnected) {
    return res.status(503).json({ success: false, error: 'WhatsApp not connected' });
  }
  try {
    const chatId = phone.replace(/\D/g, '') + '@s.whatsapp.net';
    await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: message || '' });
    res.json({ success: true });
  } catch (err) {
    console.error('Send image error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.WHATSAPP_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp server running on http://localhost:${PORT}`);
  connectToWhatsApp();
});