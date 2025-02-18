// server.js
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const WebSocket = require('ws');
const qrcode = require('qrcode-terminal');

const wss = new WebSocket.Server({ port: 8080 });
console.log('🚀 WebSocket server running on ws://localhost:8080');

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

// Load groups on startup
loadGroups();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('✅ Client connected to WebSocket');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'updateGroups') {
        groupsToMonitor = data.groups;
        saveGroups(); // Save to JSON whenever updated
        console.log(`✅ Tracking Groups Updated: ${groupsToMonitor.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  });

  ws.send(JSON.stringify({ message: "Connected to WhatsApp WebSocket Server" }));
});

// Broadcast function
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
  


// ✅ Capture ALL messages (Groups + Private)
client.on('message', async msg => {
    const chat = await msg.getChat();
    const messageText = msg.body.toLowerCase();
  
    // Show only messages containing "python"
    if (messageText.includes("python")) {
      const messageData = {
        group: chat.isGroup ? chat.name : "Private Chat",
        sender: msg.author || msg.from,
        message: msg.body,
        timestamp: new Date().toLocaleTimeString(),
      };
  
      console.log(`🐍 PYTHON FOUND [${chat.isGroup ? chat.name : 'Private Chat'}] ${msg.author || msg.from}: ${msg.body}`);
      broadcast(messageData);
    }
  });

  

// WhatsApp QR Code Handling
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('Scan the QR code to log in');
});

client.on('ready', () => {
  console.log('✅ WhatsApp bot is ready!');
});

// ✅ Start WhatsApp Client
client.initialize();























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
