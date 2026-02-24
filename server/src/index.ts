import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { initializeSockets } from './sockets';
import { authenticate } from './middleware/auth';
import { register, login, getMe } from './routes/auth';
import {
    createEvent, getAllEvents, getEventById,
    joinEvent, leaveEvent, updateEventStatus,
    deleteEvent, getMyEvents, getJoinedEvents,
} from './routes/events';

const app = express();
const httpServer = http.createServer(app);

// CORS configuration
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io
const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});
initializeSockets(io);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authenticate, getMe as any);

// Event routes
app.get('/api/events', authenticate, getAllEvents as any);
app.post('/api/events', authenticate, createEvent as any);
app.get('/api/events/my', authenticate, getMyEvents as any);
app.get('/api/events/joined', authenticate, getJoinedEvents as any);
app.get('/api/events/:id', authenticate, getEventById as any);
app.post('/api/events/:id/join', authenticate, joinEvent as any);
app.delete('/api/events/:id/leave', authenticate, leaveEvent as any);
app.patch('/api/events/:id/status', authenticate, updateEventStatus as any);
app.delete('/api/events/:id', authenticate, deleteEvent as any);

// 404 catch
app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server ready`);
});

export { io };
