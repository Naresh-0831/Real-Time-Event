export interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
    createdById: string;
    createdBy: { id: string; name: string; email: string };
    createdAt: string;
    updatedAt: string;
    _count?: { participants: number };
    participants?: EventParticipant[];
    messages?: Message[];
}

export interface EventParticipant {
    id: string;
    userId: string;
    eventId: string;
    joinedAt: string;
    user: { id: string; name: string; email: string };
}

export interface Message {
    id: string;
    content: string;
    userId: string;
    userName: string;
    eventId: string;
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
