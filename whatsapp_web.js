const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(), // Saves session so no QR scan is needed again
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot is ready and logged in!');
});

// Specify group names to monitor
const groupsToMonitor = ["Study"];

// client.on('message', async msg => {
//     const chat = await msg.getChat();

//     // Check if the message is from a group AND is in the specified groups
//     if (chat.isGroup && groupsToMonitor.includes(chat.name)) {
//         const keywords = ["urgent", "important", "alert"]; // Keywords to track

//         if (keywords.some(keyword => msg.body.toLowerCase().includes(keyword))) {
//             console.log(`🔔 Keyword found in ${chat.name}: ${msg.body}`);
//         }
//     }
// });


client.on('message', async msg => {
    const chat = await msg.getChat();

    // Check if the message is from the "Study" group
    if (chat.isGroup && groupsToMonitor.includes(chat.name)) {
        console.log(`📩 [${chat.name}] ${msg.author}: ${msg.body}`);
    }
});

client.initialize();
