import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Pricing from '../components/Pricing';

export default function Landing() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <Hero />
            <Features />
            <Pricing />
            <footer className="bg-gray-900 text-white py-8 text-center">
                <p>&copy; 2026 Tambo. All rights reserved.</p>
            </footer>
        </div>
    );
}
