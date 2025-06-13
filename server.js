// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const fileStore = require('./services/fileStore');
const apiRoutes = require('./routes/api');
const { requireLogin } = require('./middleware/authMiddleware');
const telegramService = require('./services/telegramService'); // Telegram servisini əlavə et

const app = express();
const PORT = process.env.PORT || 3000;

// --- Session Middleware ---
const sessionParser = session({
    secret: process.env.SESSION_SECRET || 'super-gizli-ve-unikal-acar-sozunuzu-bura-yazin-mutləq-dəyişin!',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
});

// --- General Middleware ---
app.use(sessionParser);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// --- Page Routes ---
app.post('/login', require('./controllers/userController').login);
app.get('/logout', require('./controllers/userController').logout);

app.get('/', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
// Add the new user management page route, protected by middleware
app.get('/users', requireLogin, require('./middleware/authMiddleware').requireOwnerRole, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

// --- API Routes ---
app.use('/api', apiRoutes);


// --- Server Initialization ---
const initializeApp = () => {
    // Ensure essential files exist
    const filesToInit = ['sifarişlər.txt', 'users.txt', 'permissions.json', 'chat_history.txt'];
    filesToInit.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, file.endsWith('.json') ? '{}' : '', 'utf-8');
            console.log(`Created missing file: ${file}`);
        }
    });
};

const server = app.listen(PORT, () => {
    initializeApp();
    console.log(`Server http://localhost:${PORT} ünvanında işləyir`);
});


// --- WebSocket Server for Chat ---
const wss = new WebSocket.Server({ noServer: true });
const clients = new Map();

wss.on('connection', (ws, request) => {
    const user = request.session.user;
    if (!user) {
        ws.close();
        return;
    }
    const clientId = uuidv4();
    clients.set(clientId, { ws, user });
    console.log(`${user.displayName} chat-a qoşuldu.`);

    const history = fileStore.getChatHistory().slice(-50);
    ws.send(JSON.stringify({ type: 'history', data: history }));

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            const messageData = {
                id: uuidv4(),
                sender: user.displayName,
                role: user.role,
                text: parsedMessage.text,
                timestamp: new Date().toISOString()
            };
            fileStore.appendToChatHistory(messageData);
            for (const client of clients.values()) {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify({ type: 'message', data: messageData }));
                }
            }
        } catch (e) {
            console.error("Gələn mesaj parse edilə bilmədi:", message);
        }
    });

    ws.on('close', () => {
        clients.delete(clientId);
        console.log(`${user.displayName} chat-dan ayrıldı.`);
    });
});

server.on('upgrade', (request, socket, head) => {
    sessionParser(request, {}, () => {
        if (!request.session.user) {
            socket.destroy();
            return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
});

// --- RENDER KEEP-ALIVE (YUXUYA GETMƏNİN QARŞISINI ALMAQ) ---
const PING_URL = process.env.RENDER_EXTERNAL_URL;

if (PING_URL) {
    // 14 dəqiqədən bir (14 * 60 * 1000 = 840000 ms) özünə sorğu göndərir
    setInterval(() => {
        console.log("Pinging self to prevent sleep...");
        fetch(PING_URL).catch(err => console.error("Ping error:", err));
    }, 14 * 60 * 1000);
}

// --- TELEGRAM VASİTƏSİLƏ FAYLLARIN AVTOMATİK GÖNDƏRİLMƏSİ ---
const bot = telegramService.bot;
const chatId = telegramService.chatId;

// Yalnız bot və chat ID təyin edilibsə bu məntiqi işə sal
if (bot && chatId) {
    // Hər 10 dəqiqədən bir (10 * 60 * 1000 millisan)
    setInterval(() => {
        console.log('Running scheduled task: Sending backup files to Telegram...');

        const filesToSend = [
            { name: 'users.txt', path: path.join(__dirname, 'users.txt') },
            { name: 'sifarişlər.txt', path: path.join(__dirname, 'sifarişlər.txt') }
        ];

        filesToSend.forEach(fileInfo => {
            // Faylın mövcud olduğunu yoxla
            if (fs.existsSync(fileInfo.path)) {
                // node-telegram-bot-api-nin sendDocument metodundan istifadə et
                bot.sendDocument(chatId, fileInfo.path)
                    .then(() => {
                        console.log(`${fileInfo.name} successfully sent to Telegram.`);
                    })
                    .catch(error => {
                        console.error(`Error sending ${fileInfo.name} to Telegram:`, error.code, error.response?.body);
                    });
            } else {
                console.warn(`Scheduled task warning: File not found at ${fileInfo.path}`);
            }
        });

    }, 10 * 60 * 1000); 

    console.log('Scheduled task for sending files to Telegram is active. It will run every 10 minutes.');
} else {
    console.warn('Scheduled task for Telegram is not active because bot token or chat ID is not configured.');
}
