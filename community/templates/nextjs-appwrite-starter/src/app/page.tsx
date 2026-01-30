"use client";

import { ChatInterface } from "@/components/chat-interface";
import { account } from "@/lib/appwrite";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await account.get();
        setIsAuthenticated(true);
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="flex items-center gap-3 animate-pulse-soft">
          <Image
            src="/Tambo-Lockup.svg"
            alt="Tambo"
            width={120}
            height={40}
            className="h-8 w-auto opacity-50"
          />
          <span className="text-2xl font-light text-muted-foreground">+</span>
          <Image
            src="/appwrite-icon.svg"
            alt="Appwrite"
            width={32}
            height={32}
            className="h-8 w-8 opacity-50"
          />
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ChatInterface />
    </div>
  );
}
