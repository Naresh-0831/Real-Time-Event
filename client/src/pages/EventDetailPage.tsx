import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Event, Message } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EventDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [event, setEvent] = useState<Event | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [participantCount, setParticipantCount] = useState(0);
    const [isJoined, setIsJoined] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [statusUpdate, setStatusUpdate] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isCreator = event?.createdById === user?.id;
    const isAdmin = user?.role === 'ADMIN';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    const fetchEvent = useCallback(async () => {
        if (!id) return;
        try {
            const res = await api.get(`/events/${id}`);
            const ev: Event = res.data.event;
            setEvent(ev);
            setMessages(ev.messages || []);
            setParticipantCount(ev._count?.participants ?? ev.participants?.length ?? 0);
            const joined = ev.participants?.some((p) => p.userId === user?.id) ?? false;
            setIsJoined(joined);
        } catch {
            toast.error('Event not found');
            navigate('/dashboard');
        } finally {
            setIsLoading(false);
        }
    }, [id, user?.id, navigate]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    // Socket.io setup
    useEffect(() => {
        if (!id || isLoading) return;
        const socket = getSocket();

        const onConnect = () => setSocketConnected(true);
        const onDisconnect = () => setSocketConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        if (socket.connected) setSocketConnected(true);

        socket.emit('join-event', id);

        socket.on('participant-count', (data: { eventId: string; count: number }) => {
            if (data.eventId === id) setParticipantCount(data.count);
        });

        socket.on('new-message', (msg: Message) => {
            if (msg.eventId === id) setMessages((prev) => [...prev, msg]);
        });

        socket.on('user-joined', (data: { user: { email: string } }) => {
            toast(`${data.user.email} joined the event`, { icon: '👋' });
        });

        socket.on('user-left', (data: { user: { email: string } }) => {
            toast(`${data.user.email} left the event`, { icon: '👋' });
        });

        socket.on('event-updated', (data: { eventId: string; status: string }) => {
            if (data.eventId === id) {
                setEvent((prev) => prev ? { ...prev, status: data.status as Event['status'] } : prev);
                toast(`Event status changed to ${data.status}`, { icon: 'ℹ️' });
            }
        });

        socket.on('error', (err: { message: string }) => {
            toast.error(err.message);
        });

        return () => {
            socket.emit('leave-event', id);
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('participant-count');
            socket.off('new-message');
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('event-updated');
            socket.off('error');
        };
    }, [id, isLoading]);

    const handleJoin = async () => {
        if (!id) return;
        setIsActionLoading(true);
        try {
            await api.post(`/events/${id}/join`);
            setIsJoined(true);
            toast.success('Joined event!');
            fetchEvent();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to join');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!id) return;
        setIsActionLoading(true);
        try {
            await api.delete(`/events/${id}/leave`);
            setIsJoined(false);
            const socket = getSocket();
            socket.emit('leave-event', id);
            toast.success('Left event');
            fetchEvent();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to leave');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSendMessage = () => {
        if (!chatInput.trim() || !id) return;
        const socket = getSocket();
        setIsSending(true);
        socket.emit('chat-message', { eventId: id, content: chatInput.trim(), userName: user?.name || user?.email || 'Unknown' });
        setChatInput('');
        setIsSending(false);
    };

    const handleStatusUpdate = async () => {
        if (!statusUpdate || !id) return;
        setIsActionLoading(true);
        try {
            await api.patch(`/events/${id}/status`, { status: statusUpdate });
            const socket = getSocket();
            socket.emit('event-status-update', { eventId: id, status: statusUpdate });
            toast.success(`Status updated to ${statusUpdate}`);
            setStatusUpdate('');
            fetchEvent();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!id || !window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await api.delete(`/events/${id}`);
            toast.success('Event deleted');
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete event');
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) return <LoadingSpinner fullScreen label="Loading event..." />;
    if (!event) return null;

    const statusClass = { ACTIVE: 'badge-active', CLOSED: 'badge-closed', ARCHIVED: 'badge-archived' }[event.status];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Back */}
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT – Event info + Chat */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Event Header Card */}
                    <div className="card p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
                                    <span className={statusClass}>{event.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{event.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span>by <strong className="text-gray-600 dark:text-gray-300">{event.createdBy?.name}</strong></span>
                                    <span>Created {new Date(event.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 shrink-0">
                                {!isCreator && event.status === 'ACTIVE' && (
                                    isJoined ? (
                                        <button onClick={handleLeave} disabled={isActionLoading} className="btn-danger text-sm py-2 px-4">
                                            {isActionLoading ? <LoadingSpinner size="sm" /> : 'Leave Event'}
                                        </button>
                                    ) : (
                                        <button onClick={handleJoin} disabled={isActionLoading} className="btn-primary text-sm py-2 px-4">
                                            {isActionLoading ? <LoadingSpinner size="sm" /> : 'Join Event'}
                                        </button>
                                    )
                                )}
                                {(isCreator || isAdmin) && (
                                    <button onClick={handleDeleteEvent} className="btn-secondary text-red-500 dark:text-red-400 text-sm py-2 px-4">
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Admin/Creator status update */}
                        {(isCreator || isAdmin) && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-600 flex gap-2">
                                <select
                                    className="input text-sm flex-1"
                                    value={statusUpdate}
                                    onChange={(e) => setStatusUpdate(e.target.value)}
                                >
                                    <option value="">Change status...</option>
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="CLOSED">CLOSED</option>
                                    <option value="ARCHIVED">ARCHIVED</option>
                                </select>
                                <button onClick={handleStatusUpdate} disabled={!statusUpdate || isActionLoading} className="btn-primary text-sm px-4">
                                    Update
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Live Chat */}
                    <div className="card flex flex-col h-[480px]">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-600">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">Live Chat</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={socketConnected ? 'status-dot-online' : 'status-dot-offline'}></span>
                                <span className="text-xs text-gray-400">{socketConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <p className="text-3xl mb-2">💬</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">No messages yet. Say hello!</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isOwn = msg.userId === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isOwn
                                                    ? 'bg-primary-600 text-white rounded-br-sm'
                                                    : 'bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                                                }`}>
                                                {!isOwn && <p className="text-xs font-semibold text-primary-500 dark:text-primary-400 mb-0.5">{msg.userName}</p>}
                                                <p className="break-words">{msg.content}</p>
                                                <p className={`text-xs mt-0.5 ${isOwn ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-dark-600">
                            {isJoined || isCreator ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="input flex-1 text-sm"
                                        placeholder="Type a message..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        disabled={!socketConnected || event.status !== 'ACTIVE'}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim() || isSending || !socketConnected || event.status !== 'ACTIVE'}
                                        className="btn-primary px-4 py-2.5 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <p className="text-center text-sm text-gray-400 dark:text-gray-500">Join the event to chat</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT – Participants */}
                <div className="flex flex-col gap-6">
                    {/* Stats */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Event Stats</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Participants</span>
                                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{participantCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Messages</span>
                                <span className="text-lg font-bold text-gray-700 dark:text-gray-200">{messages.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                                <span className={statusClass}>{event.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Participants List */}
                    <div className="card p-5 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                            Participants ({participantCount})
                        </h3>
                        {event.participants && event.participants.length > 0 ? (
                            <div className="space-y-2.5">
                                {event.participants.map((p) => (
                                    <div key={p.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                            {p.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.user.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{p.user.email}</p>
                                        </div>
                                        {p.userId === event.createdById && (
                                            <span className="badge badge-active ml-auto text-xs">Host</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No participants yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailPage;
