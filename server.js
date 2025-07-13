// server.js
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const WebSocket = require('ws');
const qrcode = require('qrcode-terminal');
// RESET AUTH FIX
// rm -rf /mnt/c/coding\ projects/whatsapp_tracking/whatsapp_tracking/.wwebjs_auth/session/Default/IndexedDB/https_web.whatsapp.com_0.indexeddb.leveldb/rm -rf /mnt/c/coding\ projects/whatsapp_tracking/whatsapp_tracking/.wwebjs_auth
// ✅ Start WebSocket server
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });
console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);

// ✅ Initialize WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  receiveSelf: true,
});

// ✅ Load Groups from `groups.json`
const groupsFile = path.join(__dirname, 'groups.json');
let groupsToMonitor = [];

function loadGroups() {
  try {
    const data = fs.readFileSync(groupsFile, 'utf8');
    groupsToMonitor = JSON.parse(data);
    console.log('✅ Groups Loaded:', groupsToMonitor);
  } catch (error) {
    console.error('⚠️ Error loading groups:', error.message);
    groupsToMonitor = [];
  }
}

function saveGroups() {
  try {
    fs.writeFileSync(groupsFile, JSON.stringify(groupsToMonitor, null, 2));
    console.log('💾 Groups Saved:', groupsToMonitor);
  } catch (error) {
    console.error('❌ Error saving groups:', error.message);
  }
}

// ✅ Load groups on startup (even if not filtering)
loadGroups();

// ✅ Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('✅ Client connected to WebSocket');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'updateGroups') {
        groupsToMonitor = data.groups;
        saveGroups();
        console.log(`✅ Tracking Groups Updated: ${groupsToMonitor.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  });

  ws.send(JSON.stringify({ message: 'Connected to WhatsApp WebSocket Server' }));
});

// ✅ Broadcast function to all WebSocket clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// ✅ Capture ALL messages (Groups + Private)
client.on('message', async (msg) => {
  try {
    const chat = await msg.getChat();
    const messageText = msg.body.toLowerCase();

    // ✅ Show only messages containing "python"
    if (messageText.includes('python')) {
      const contact = await msg.getContact();
      const senderName = contact.pushname || contact.name || msg._data.notifyName || 'Unknown';

      const messageData = {
        groupName: chat.isGroup ? chat.name : 'Private Chat',
        sender: senderName,
        message: msg.body,
        timestamp: new Date().toLocaleTimeString(),
        isGroup: chat.isGroup,
      };

      console.log(`🐍 PYTHON FOUND [${messageData.groupName}] ${messageData.sender}: ${msg.body}`);
      broadcast(messageData);
    }
  } catch (error) {
    console.error('❌ Error processing message:', error);
  }
});

// ✅ WhatsApp QR Code Handling
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('Scan the QR code to log in');
});

client.on('ready', () => {
  console.log('✅ WhatsApp bot is ready!');
});

// ✅ Start WhatsApp Client
client.initialize();

// ✅ Graceful shutdown (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down...');
  client.destroy();
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});






















// ✅ Capture only defined groups (with smart matching)
// client.on('message', async msg => {
//     const chat = await msg.getChat();
//     const chatName = chat.name?.toLowerCase().trim(); // Normalize group name
  
//     // Use case-insensitive and trimmed matching
//     const isMonitored = groupsToMonitor.some(group => 
//       group.toLowerCase().trim() === chatName
//     );
  
//     if (chat.isGroup && isMonitored) {
//       const messageData = {
//         group: chat.name,
//         sender: msg.author || msg.from,
//         message: msg.body,
//         timestamp: new Date().toLocaleTimeString(),
//       };
  
//       console.log(`📩 [${chat.name}] ${msg.author || msg.from}: ${msg.body}`);
//       broadcast(messageData);
//     }
//   });
