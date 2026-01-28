import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold text-indigo-600">
                            Tambo
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-700 hover:text-indigo-600 transition">
                            Features
                        </a>
                        <a href="#pricing" className="text-gray-700 hover:text-indigo-600 transition">
                            Pricing
                        </a>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link
                            to="/login"
                            className="text-gray-700 hover:text-indigo-600 transition font-medium"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                        >
                            Register
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
