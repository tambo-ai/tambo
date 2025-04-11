"use client";

import { Header } from "@/components/sections/header";
import { motion } from "framer-motion";
import { Suspense } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const fadeInVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        showDashboardButton={false}
        showLogoutButton={true}
        transparent={false}
      />

      {/* Scrollable Content Area */}
      <div className="container mx-auto px-4 py-6 md:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
        >
          <Suspense fallback={<div className="h-32 animate-pulse"></div>}>
            {children}
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
