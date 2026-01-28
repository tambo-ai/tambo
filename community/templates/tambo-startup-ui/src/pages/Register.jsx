import { Link } from 'react-router-dom';

export default function Register() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
            <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-10">
                    <Link to="/" className="text-3xl font-bold text-indigo-600 hover:text-indigo-700 transition">
                        Tambo
                    </Link>
                    <h2 className="text-3xl font-bold text-gray-900 mt-6 mb-2">
                        Create Account
                    </h2>
                    <p className="text-gray-600">
                        Get started in less than 30 seconds
                    </p>
                </div>

                <form className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Must be at least 8 characters
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
                    >
                        Create Account
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-8 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition">
                        Sign in
                    </Link>
                </p>

                <p className="text-center text-gray-400 text-xs mt-6 italic">
                    UI-only template • No authentication logic
                </p>
            </div>
        </div>
    );
}
