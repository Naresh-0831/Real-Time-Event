import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        title: 'Real-Time Updates',
        desc: 'Instant WebSocket-powered participant counts, chat, and event status changes.',
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
        ),
        title: 'Live Chat',
        desc: 'Communicate with all event participants in real time inside every event room.',
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
        title: 'Secure Auth',
        desc: 'JWT-based authentication with bcrypt password hashing and role-based access.',
    },
];

const HomePage = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="relative overflow-hidden">
            {/* Background gradient blobs */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

            {/* Hero */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium mb-6">
                    <span className="status-dot-online"></span>
                    Live & Real-Time
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
                    <span className="text-gray-900 dark:text-white">Events that </span>
                    <span className="text-gradient">sync instantly</span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Create and join events. See live participant counts, chat in real time, and collaborate — all powered by WebSockets.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="btn-primary text-base px-8 py-3">
                            Go to Dashboard →
                        </Link>
                    ) : (
                        <>
                            <Link to="/register" className="btn-primary text-base px-8 py-3">
                                Get Started Free
                            </Link>
                            <Link to="/login" className="btn-secondary text-base px-8 py-3">
                                Sign In
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* Features */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="card p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-md">
                                {f.icon}
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default HomePage;
