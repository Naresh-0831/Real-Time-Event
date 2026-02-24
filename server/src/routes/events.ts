import { Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth';

const createEventSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
});

const validStatuses = ['ACTIVE', 'CLOSED', 'ARCHIVED'] as const;

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = createEventSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.errors[0].message });
            return;
        }

        const { title, description } = parsed.data;

        const event = await prisma.event.create({
            data: {
                title,
                description,
                createdById: req.user!.id,
            },
        });

        res.status(201).json({ event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const status =
            typeof req.query.status === 'string' && validStatuses.includes(req.query.status as any)
                ? (req.query.status as (typeof validStatuses)[number])
                : undefined;

        const events = await prisma.event.findMany({
            where: {
                ...(search && {
                    OR: [
                        { title: { contains: search } },
                        { description: { contains: search } },
                    ],
                }),
                ...(status && { status }),
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getEventById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const event = await prisma.event.findUnique({
            where: { id },
        });

        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        res.json({ event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const joinEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const event = await prisma.event.findUnique({ where: { id } });

        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        if (event.status !== 'ACTIVE') {
            res.status(400).json({ message: 'Event is not active' });
            return;
        }

        const existing = await prisma.eventParticipant.findUnique({
            where: {
                userId_eventId: {
                    userId: req.user!.id,
                    eventId: id,
                },
            },
        });

        if (existing) {
            res.status(409).json({ message: 'Already joined' });
            return;
        }

        const participant = await prisma.eventParticipant.create({
            data: {
                userId: req.user!.id,
                eventId: id,
            },
        });

        res.status(201).json({ participant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const leaveEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        await prisma.eventParticipant.delete({
            where: {
                userId_eventId: {
                    userId: req.user!.id,
                    eventId: id,
                },
            },
        });

        res.json({ message: 'Left successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateEventStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const status =
            typeof req.body.status === 'string' &&
            validStatuses.includes(req.body.status as any)
                ? (req.body.status as (typeof validStatuses)[number])
                : undefined;

        if (!status) {
            res.status(400).json({ message: 'Invalid status' });
            return;
        }

        const updated = await prisma.event.update({
            where: { id },
            data: { status },
        });

        res.json({ event: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        await prisma.event.delete({ where: { id } });

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMyEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const events = await prisma.event.findMany({
            where: { createdById: req.user!.id },
        });

        res.json({ events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getJoinedEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const events = await prisma.eventParticipant.findMany({
            where: { userId: req.user!.id },
            include: { event: true },
        });

        res.json({ events: events.map((e) => e.event) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};