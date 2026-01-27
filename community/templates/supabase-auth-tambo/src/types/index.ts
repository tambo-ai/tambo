import { ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  note?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface LayoutProps {
  children: ReactNode;
}
