import { Link } from 'react-router-dom';

export default function Pricing() {
    const plans = [
        {
            name: 'Free',
            price: '$0',
            period: 'forever',
            features: [
                'Up to 3 projects',
                'Basic analytics',
                'Community support',
                '1GB storage',
            ],
            cta: 'Get Started',
            highlighted: false,
        },
        {
            name: 'Pro',
            price: '$29',
            period: 'per month',
            features: [
                'Unlimited projects',
                'Advanced analytics',
                'Priority support',
                '50GB storage',
            ],
            cta: 'Start Free Trial',
            highlighted: true,
        },
        {
            name: 'Enterprise',
            price: '$99',
            period: 'per month',
            features: [
                'Everything in Pro',
                'Custom integrations',
                'Dedicated support',
                'Unlimited storage',
            ],
            cta: 'Contact Sales',
            highlighted: false,
        },
    ];

    return (
        <section id="pricing" className="py-24 px-4 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-xl text-gray-600 mb-3">
                        Choose the plan that fits your needs
                    </p>
                    <p className="text-sm text-gray-500 italic">
                        Pricing shown for demo purposes only.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`bg-white p-8 rounded-2xl border transition-all duration-300 ${plan.highlighted
                                    ? 'border-indigo-300 shadow-xl ring-2 ring-indigo-100'
                                    : 'border-gray-200 hover:shadow-lg hover:border-gray-300'
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full inline-block mb-6">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {plan.name}
                            </h3>
                            <div className="mb-6">
                                <span className="text-5xl font-bold text-gray-900">
                                    {plan.price}
                                </span>
                                <span className="text-gray-600 ml-2">/ {plan.period}</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center text-gray-700">
                                        <svg
                                            className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/register"
                                className={`block w-full text-center py-3 rounded-lg font-semibold transition ${plan.highlighted
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
