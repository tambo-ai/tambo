import { Link } from 'react-router-dom';

export default function Hero() {
    return (
        <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-24 px-4 relative overflow-hidden">
            {/* Subtle background shapes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 -z-10"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-30 -z-10"></div>

            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                        Launch Your SaaS Faster with{' '}
                        <span className="text-indigo-600 block mt-2">Ready-Made UI Templates</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-3 max-w-3xl mx-auto leading-relaxed">
                        Production-ready React + Tailwind templates designed to plug into Tambo effortlessly.
                    </p>
                    <p className="text-lg md:text-xl text-indigo-600 font-semibold mb-10">
                        Designed for hackers, founders, and indie builders.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <Link
                            to="/register"
                            className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/dashboard"
                            className="inline-block bg-white text-indigo-600 px-10 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition border-2 border-indigo-200 hover:border-indigo-300"
                        >
                            View Dashboard
                        </Link>
                    </div>
                </div>

                {/* Visual Anchor - Dashboard Preview Card */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="text-white text-sm font-medium">Dashboard Preview</div>
                        </div>
                        <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                    <div className="text-gray-500 text-xs font-medium mb-1">Total Users</div>
                                    <div className="text-2xl font-bold text-gray-900">2,543</div>
                                    <div className="text-green-600 text-xs font-semibold mt-1">+12%</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                    <div className="text-gray-500 text-xs font-medium mb-1">Revenue</div>
                                    <div className="text-2xl font-bold text-gray-900">$45K</div>
                                    <div className="text-green-600 text-xs font-semibold mt-1">+8%</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                    <div className="text-gray-500 text-xs font-medium mb-1">Projects</div>
                                    <div className="text-2xl font-bold text-gray-900">12</div>
                                    <div className="text-green-600 text-xs font-semibold mt-1">+3%</div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-semibold text-gray-900">Recent Activity</div>
                                    <div className="text-xs text-gray-500">Last 7 days</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 bg-indigo-100 rounded-full w-full"></div>
                                    <div className="h-2 bg-indigo-100 rounded-full w-4/5"></div>
                                    <div className="h-2 bg-indigo-100 rounded-full w-3/4"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
