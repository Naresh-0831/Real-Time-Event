import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

interface TokenPayload {
    id: string;
    email: string;
    role: string;
    name?: string;
}

interface AuthSocket extends Socket {
    user?: TokenPayload;
}

export const initializeSockets = (io: Server) => {
    // Middleware to authenticate socket connections
    io.use((socket: AuthSocket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
            socket.user = decoded;
            next();
        } catch {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: AuthSocket) => {
        console.log(`✅ Socket connected: ${socket.id} | User: ${socket.user?.email}`);

        // Join an event room
        socket.on('join-event', async (eventId: string) => {
            try {
                socket.join(`event:${eventId}`);
                const count = await prisma.eventParticipant.count({ where: { eventId } });
                // Notify all in the room of updated participant count
                io.to(`event:${eventId}`).emit('participant-count', { eventId, count });
                // Notify others that a user joined
                socket.to(`event:${eventId}`).emit('user-joined', {
                    eventId,
                    user: { id: socket.user?.id, email: socket.user?.email },
                });
                console.log(`User ${socket.user?.email} joined room event:${eventId}`);
            } catch (error) {
                console.error('Socket join-event error:', error);
                socket.emit('error', { message: 'Failed to join event room' });
            }
        });

        // Leave an event room
        socket.on('leave-event', async (eventId: string) => {
            try {
                socket.leave(`event:${eventId}`);
                const count = await prisma.eventParticipant.count({ where: { eventId } });
                io.to(`event:${eventId}`).emit('participant-count', { eventId, count });
                socket.to(`event:${eventId}`).emit('user-left', {
                    eventId,
                    user: { id: socket.user?.id, email: socket.user?.email },
                });
                console.log(`User ${socket.user?.email} left room event:${eventId}`);
            } catch (error) {
                console.error('Socket leave-event error:', error);
                socket.emit('error', { message: 'Failed to leave event room' });
            }
        });

        // Chat message
        socket.on('chat-message', async (data: { eventId: string; content: string; userName: string }) => {
            try {
                if (!data.content?.trim() || !data.eventId) {
                    socket.emit('error', { message: 'Invalid message data' });
                    return;
                }

                const message = await prisma.message.create({
                    data: {
                        content: data.content.trim(),
                        userId: socket.user!.id,
                        userName: data.userName || socket.user?.email || 'Unknown',
                        eventId: data.eventId,
                    },
                });

                io.to(`event:${data.eventId}`).emit('new-message', {
                    id: message.id,
                    content: message.content,
                    userId: message.userId,
                    userName: message.userName,
                    eventId: message.eventId,
                    createdAt: message.createdAt,
                });
            } catch (error) {
                console.error('Socket chat-message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Event status update (admin/creator only)
        socket.on('event-status-update', async (data: { eventId: string; status: string }) => {
            try {
                const event = await prisma.event.findUnique({ where: { id: data.eventId } });
                if (!event) return;
                if (event.createdById !== socket.user?.id && socket.user?.role !== 'ADMIN') {
                    socket.emit('error', { message: 'Not authorized to update event status' });
                    return;
                }
                io.to(`event:${data.eventId}`).emit('event-updated', {
                    eventId: data.eventId,
                    status: data.status,
                });
            } catch (error) {
                console.error('Socket event-status-update error:', error);
                socket.emit('error', { message: 'Failed to update event status' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`❌ Socket disconnected: ${socket.id} | User: ${socket.user?.email}`);
        });
    });
};
