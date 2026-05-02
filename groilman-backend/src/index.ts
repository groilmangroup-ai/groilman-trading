import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:3001'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

import marketRoutes from './routes/market';
import authRoutes from './routes/auth';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/market', marketRoutes);
app.use('/api/auth', authRoutes);

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

import { marketService } from './services/market.service';

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // El servicio se inicializa automáticamente al ser importado
});

export { io };
