import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Event } from '../types';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const FILTERS = ['ALL', 'ACTIVE', 'CLOSED', 'ARCHIVED'] as const;
type Filter = typeof FILTERS[number];

const DashboardPage = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<Filter>('ALL');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'joined'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ title: '', description: '' });
    const [isCreating, setIsCreating] = useState(false);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string> = {};
            if (search) params.search = search;
            if (filter !== 'ALL') params.status = filter;

            let endpoint = '/events';
            if (activeTab === 'mine') endpoint = '/events/my';
            else if (activeTab === 'joined') endpoint = '/events/joined';

            const res = await api.get(endpoint, { params });
            setEvents(res.data.events);

            // Fetch joined events ids for state
            if (activeTab === 'all') {
                const joinedRes = await api.get('/events/joined');
                setJoinedIds(new Set(joinedRes.data.events.map((e: Event) => e.id)));
            } else if (activeTab === 'joined') {
                setJoinedIds(new Set(res.data.events.map((e: Event) => e.id)));
            }
        } catch {
            toast.error('Failed to load events');
        } finally {
            setIsLoading(false);
        }
    }, [search, filter, activeTab]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleJoin = async (eventId: string) => {
        setActionLoading(eventId);
        try {
            await api.post(`/events/${eventId}/join`);
            setJoinedIds((prev) => new Set([...prev, eventId]));
            setEvents((prev) =>
                prev.map((e) =>
                    e.id === eventId ? { ...e, _count: { participants: (e._count?.participants ?? 0) + 1 } } : e
                )
            );
            toast.success('Joined event!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to join event');
        } finally {
            setActionLoading(null);
        }
    };

    const handleLeave = async (eventId: string) => {
        setActionLoading(eventId);
        try {
            await api.delete(`/events/${eventId}/leave`);
            setJoinedIds((prev) => { const s = new Set(prev); s.delete(eventId); return s; });
            setEvents((prev) =>
                prev.map((e) =>
                    e.id === eventId ? { ...e, _count: { participants: Math.max(0, (e._count?.participants ?? 1) - 1) } } : e
                )
            );
            toast.success('Left event');
            if (activeTab === 'joined') setEvents((prev) => prev.filter((e) => e.id !== eventId));
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to leave event');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreate = async () => {
        if (!createForm.title.trim() || !createForm.description.trim()) {
            toast.error('Please fill in all fields');
            return;
        }
        setIsCreating(true);
        try {
            const res = await api.post('/events', createForm);
            toast.success('Event created!');
            setShowCreateModal(false);
            setCreateForm({ title: '', description: '' });
            setEvents((prev) => [res.data.event, ...prev]);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create event');
        } finally {
            setIsCreating(false);
        }
    };

    const filteredEvents = events.filter((e) => {
        if (activeTab !== 'all') return true;
        if (filter !== 'ALL' && e.status !== filter) return false;
        return true;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome, {user?.name}! 👋
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your events and discover new ones</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary text-sm shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Event
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl w-fit mb-6">
                {(['all', 'mine', 'joined'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all duration-200 ${activeTab === tab
                                ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        {tab === 'all' ? 'All Events' : tab === 'mine' ? 'My Events' : 'Joined'}
                    </button>
                ))}
            </div>

            {/* Search & Filter (shown only on All tab) */}
            {activeTab === 'all' && (
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search events..."
                            className="input pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${filter === f
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-dark-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-500 hover:border-primary-300'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Events Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" label="Loading events..." />
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">🗓️</div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No events found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {activeTab === 'all' ? 'Try a different search or filter.' : 'Create or join an event to get started.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onJoin={handleJoin}
                            onLeave={handleLeave}
                            isJoined={joinedIds.has(event.id)}
                            isCreator={event.createdById === user?.id}
                            isLoading={actionLoading === event.id}
                        />
                    ))}
                </div>
            )}

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="card w-full max-w-md p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Event</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="label" htmlFor="eventTitle">Title</label>
                                <input
                                    id="eventTitle"
                                    type="text"
                                    className="input"
                                    placeholder="Enter event title"
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label" htmlFor="eventDesc">Description</label>
                                <textarea
                                    id="eventDesc"
                                    className="input resize-none h-28"
                                    placeholder="Describe your event..."
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 text-sm">
                                    Cancel
                                </button>
                                <button onClick={handleCreate} disabled={isCreating} className="btn-primary flex-1 text-sm">
                                    {isCreating ? <LoadingSpinner size="sm" /> : 'Create Event'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
