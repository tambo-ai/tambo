export default function Features() {
    const features = [
        {
            title: 'Optimized React + Tailwind',
            description: 'Modern stack with zero bloat. Fast builds, clean code, instant hot reload.',
            icon: (
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
        },
        {
            title: 'Drop-in Tambo Ready',
            description: 'Pre-structured for seamless backend integration. Connect your API in minutes.',
            icon: (
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            ),
        },
        {
            title: 'Production-Grade Structure',
            description: 'Component-based architecture. Scalable, maintainable, and easy to extend.',
            icon: (
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
        },
    ];

    return (
        <section id="features" className="py-24 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Everything You Need
                    </h2>
                    <p className="text-xl text-gray-600 mb-3">
                        Powerful features to help you ship faster
                    </p>
                    <p className="text-gray-700 font-medium">
                        Built for developers who want speed without sacrificing quality.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-100"
                        >
                            <div className="mb-6 flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-xl">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
