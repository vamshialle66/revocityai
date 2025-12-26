import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getAuthAsync } from "@/lib/firebase";
import { isUserAdmin } from "@/lib/userRoles";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  checkingAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const checkAdminStatus = async (userId: string) => {
    setCheckingAdmin(true);
    try {
      const adminStatus = await isUserAdmin(userId);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const refreshAdminStatus = async () => {
    if (user) {
      await checkAdminStatus(user.uid);
    }
  };

  // Register user in Supabase when they log in
  const registerUserInSupabase = async (firebaseUser: User) => {
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          }),
        }
      );
    } catch (error) {
      console.error("Error registering user in Supabase:", error);
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};
    let mounted = true;

    (async () => {
      try {
        const auth = await getAuthAsync();
        unsubscribe = onAuthStateChanged(auth, async (u) => {
          if (!mounted) return;
          setUser(u);
          setLoading(false);
          
          if (u) {
            // Register/update user in Supabase
            await registerUserInSupabase(u);
            await checkAdminStatus(u.uid);
          } else {
            setIsAdmin(false);
            setCheckingAdmin(false);
          }
        });
      } catch {
        if (!mounted) return;
        setUser(null);
        setLoading(false);
        setIsAdmin(false);
        setCheckingAdmin(false);
      }
    })();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const auth = await getAuthAsync();
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const auth = await getAuthAsync();
      await createUserWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    const auth = await getAuthAsync();
    await firebaseSignOut(auth);
    setIsAdmin(false);
  };

  const value = {
    user,
    loading,
    isAdmin,
    checkingAdmin,
    signIn,
    signUp,
    signOut,
    refreshAdminStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

