"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'];
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});
exports.io = io;
const PORT = process.env.PORT || 3001;
const market_1 = __importDefault(require("./routes/market"));
const auth_1 = __importDefault(require("./routes/auth"));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/market', market_1.default);
app.use('/api/auth', auth_1.default);
app.get('/', (req, res) => {
    res.send('Groilman Trading Backend API is running');
});
// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // El servicio se inicializa automáticamente al ser importado
});
//# sourceMappingURL=index.js.map