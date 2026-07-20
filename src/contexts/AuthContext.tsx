import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { authService, type User } from "@/services/authService";
import { isSupabaseConfigured } from "@/lib/supabase";

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  usesBackend: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onChange(setUser);
    authService.initialize().finally(() => {
      setUser(authService.getCurrentUser());
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = (email: string, password: string) =>
    authService.login(email, password);

  const signUp = (name: string, email: string, password: string) =>
    authService.register({ name, email, password });

  const signOut = () => authService.logout();

  const value: AuthContextValue = {
    user,
    loading,
    usesBackend: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    refresh: () => setUser(authService.getCurrentUser()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
