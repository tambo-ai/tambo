"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "gradient" | "glass";
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
  hover = false,
  onClick,
}) => {
  const variants = {
    default: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
    gradient: "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 dark:border-indigo-800/50",
    glass: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/20",
  };

  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl shadow-lg overflow-hidden",
        variants[variant],
        hover && "cursor-pointer transition-all duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={cn("px-6 py-4 border-b border-gray-100 dark:border-gray-800", className)}>
    {children}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={cn("px-6 py-4", className)}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={cn("px-6 py-4 border-t border-gray-100 dark:border-gray-800", className)}>
    {children}
  </div>
);

export { Card, CardHeader, CardContent, CardFooter };
