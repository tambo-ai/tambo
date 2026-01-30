"use client";

import { X, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ErrorPopupProps {
    message: string;
    onClose: () => void;
}

export function ErrorPopup({ message, onClose }: ErrorPopupProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? "opacity-100 backdrop-blur-sm bg-black/50" : "opacity-0 pointer-events-none"}`}>
            <div className={`w-full max-w-[350px] bg-background border border-border rounded-xl shadow-2xl transform transition-all duration-300 ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertCircle size={24} />
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">
                        Authentication Failed
                    </h3>

                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                        {message}
                    </p>

                    <button
                        onClick={handleClose}
                        className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all text-sm"
                    >
                        Try Again
                    </button>
                </div>

                {/* Close X top right */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
