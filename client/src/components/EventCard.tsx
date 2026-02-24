import { Event } from '../types';
import { Link } from 'react-router-dom';

interface EventCardProps {
    event: Event;
    onJoin?: (id: string) => void;
    onLeave?: (id: string) => void;
    isJoined?: boolean;
    isCreator?: boolean;
    isLoading?: boolean;
}

const EventCard = ({ event, onJoin, onLeave, isJoined, isCreator, isLoading }: EventCardProps) => {
    const statusClass = {
        ACTIVE: 'badge-active',
        CLOSED: 'badge-closed',
        ARCHIVED: 'badge-archived',
    }[event.status];

    const participantCount = event._count?.participants ?? event.participants?.length ?? 0;

    return (
        <div className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-3">
                <Link to={`/events/${event.id}`} className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate">
                        {event.title}
                    </h3>
                </Link>
                <span className={statusClass}>{event.status}</span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{event.description}</p>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{event.createdBy?.name || 'Unknown'}</span>
                    </div>
                </div>

                {event.status === 'ACTIVE' && (
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/events/${event.id}`}
                            className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline"
                        >
                            View →
                        </Link>
                        {!isCreator && (
                            isJoined ? (
                                <button
                                    onClick={() => onLeave?.(event.id)}
                                    disabled={isLoading}
                                    className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 font-medium transition-colors disabled:opacity-50"
                                >
                                    Leave
                                </button>
                            ) : (
                                <button
                                    onClick={() => onJoin?.(event.id)}
                                    disabled={isLoading}
                                    className="text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 font-medium transition-colors disabled:opacity-50"
                                >
                                    Join
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventCard;
