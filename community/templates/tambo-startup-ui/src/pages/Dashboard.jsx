import { Link, useSearchParams } from 'react-router-dom';

export default function Dashboard() {
    const [searchParams] = useSearchParams();
    const section = searchParams.get('section') || 'dashboard';

    const stats = [
        { label: 'Total Users', value: '2,543', change: '+12%', trend: 'up' },
        { label: 'Revenue', value: '$45,231', change: '+8%', trend: 'up' },
        { label: 'Active Projects', value: '12', change: '+3%', trend: 'up' },
    ];

    const recentActivity = [
        { user: 'Sarah Johnson', action: 'Created new project', time: '2 minutes ago', status: 'success' },
        { user: 'Mike Chen', action: 'Updated dashboard settings', time: '15 minutes ago', status: 'info' },
        { user: 'Emma Davis', action: 'Completed onboarding', time: '1 hour ago', status: 'success' },
        { user: 'Alex Kumar', action: 'Invited team member', time: '3 hours ago', status: 'info' },
        { user: 'Lisa Park', action: 'Upgraded to Pro plan', time: '5 hours ago', status: 'success' },
    ];

    const navItems = [
        {
            name: 'Dashboard',
            section: 'dashboard',
            icon: (
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Analytics',
            section: 'analytics',
            icon: (
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            name: 'Settings',
            section: 'settings',
            icon: (
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
    ];

    const renderContent = () => {
        if (section === 'analytics') {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <svg className="w-16 h-16 text-indigo-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Analytics View Placeholder</h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                        This section is reserved for future Tambo integrations.
                    </p>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 max-w-2xl mx-auto">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            <strong>This is a UI-only placeholder.</strong><br />
                            Designed to demonstrate layout and structure for future Tambo integrations.
                        </p>
                    </div>
                </div>
            );
        }

        if (section === 'settings') {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <svg className="w-16 h-16 text-indigo-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Settings View Placeholder</h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                        This section is reserved for future Tambo integrations.
                    </p>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 max-w-2xl mx-auto">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            <strong>This is a UI-only placeholder.</strong><br />
                            Designed to demonstrate layout and structure for future Tambo integrations.
                        </p>
                    </div>
                </div>
            );
        }

        // Default dashboard content
        return (
            <>
                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
                        >
                            <p className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">
                                {stat.label}
                            </p>
                            <div className="flex items-end justify-between">
                                <p className="text-4xl font-bold text-gray-900">
                                    {stat.value}
                                </p>
                                <span className="text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full">
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Track user actions and system events in real-time
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Action
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {recentActivity.map((activity, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                                                    {activity.user.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{activity.user}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{activity.action}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">{activity.time}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${activity.status === 'success'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {activity.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Integration Notice */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-indigo-600 mr-4 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">UI-Only Template</h3>
                            <p className="text-gray-700 leading-relaxed">
                                This is a frontend-only dashboard ready for integration. Connect your Tambo backend, Firebase, Supabase, or custom API to populate real data. All components are structured for easy data binding and state management.
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const getPageTitle = () => {
        if (section === 'analytics') return 'Analytics';
        if (section === 'settings') return 'Settings';
        return 'Dashboard';
    };

    const getPageDescription = () => {
        if (section === 'analytics') return 'View detailed analytics and insights';
        if (section === 'settings') return 'Manage your account and preferences';
        return "Welcome back! Here's your overview.";
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <Link to="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition">
                        Tambo
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">Dashboard v1.0</p>
                </div>
                <nav className="mt-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.section}
                            to={`/dashboard?section=${item.section}`}
                            className={`flex items-center px-6 py-3 transition ${section === item.section
                                    ? 'text-gray-900 bg-indigo-50 border-r-4 border-indigo-600 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    ))}
                    <Link
                        to="/"
                        className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition mt-4"
                    >
                        <svg
                            className="w-5 h-5 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                        Logout
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                    <div className="px-8 py-6">
                        <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
                        <p className="text-gray-600 mt-1">{getPageDescription()}</p>
                    </div>
                </header>

                {/* Content */}
                <main className="p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
