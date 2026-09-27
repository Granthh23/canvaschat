'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { saveProfileDb, subscribeToProfiles } from '@/lib/supabase/service';
import { User as SupabaseAuthUser } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: SupabaseAuthUser | null;
  profile: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (email: string, pass: string, name: string) => Promise<{ error?: string; message?: string }>;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signInGuest: (name: string, avatar?: string) => void;
  signOut: () => Promise<void>;
  updateProfile: (name: string, avatar: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoggedIn: false,
  isLoading: false,
  isConfigured: false,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signInGuest: () => {},
  signOut: async () => {},
  updateProfile: () => {},
});

const LOCAL_STORAGE_KEY_USER_PROFILE = 'canvaschat_user_profile';
const LOCAL_STORAGE_KEY_ACCOUNTS = 'canvaschat_user_accounts_list';

export const INITIAL_REGISTERED_ACCOUNTS: UserProfile[] = [];

export function getStoredAccounts(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAccountToList(newAccount: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredAccounts();
    const filtered = list.filter(
      (a) =>
        (a.id !== newAccount.id) &&
        (!a.email || !newAccount.email || a.email.toLowerCase() !== newAccount.email.toLowerCase())
    );
    const updated = [newAccount, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_KEY_ACCOUNTS, JSON.stringify(updated));
    saveProfileDb(newAccount);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY_USER_PROFILE);
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return null; // Default to logged out
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync incoming registered profiles automatically into stored accounts list
  useEffect(() => {
    const unsubscribe = subscribeToProfiles((newProfile) => {
      saveAccountToList({
        id: newProfile.id,
        name: newProfile.name,
        avatar: newProfile.avatar,
        email: newProfile.email,
        isGuest: false,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync Supabase Auth Session if available
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member';
        const avatar = session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`;
        
        const newProfile: UserProfile = {
          id: session.user.id,
          name,
          avatar,
          email: session.user.email,
          isGuest: false,
        };
        setProfile(newProfile);
        saveAccountToList(newProfile);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_USER_PROFILE, JSON.stringify(newProfile));
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member';
        const avatar = session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`;
        
        const newProfile: UserProfile = {
          id: session.user.id,
          name,
          avatar,
          email: session.user.email,
          isGuest: false,
        };
        setProfile(newProfile);
        saveAccountToList(newProfile);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_USER_PROFILE, JSON.stringify(newProfile));
        } catch {
          // ignore
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Universal Sign Up (Works both with Supabase Auth & Local Accounts mode!)
  const signUp = async (email: string, pass: string, name: string) => {
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    const userId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newProfile: UserProfile = {
      id: userId,
      name,
      avatar,
      email: email.toLowerCase().trim(),
      isGuest: false,
    };

    // If Supabase is configured, attempt Supabase Auth Sign Up
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              full_name: name,
              avatar_url: avatar,
            },
          },
        });

        if (!error && data.user) {
          newProfile.id = data.user.id;
          if (data.session) {
            setUser(data.user);
          }
        }
      } catch {
        // Fallback to local account creation
      }
    }

    // Activate Profile & Save
    setProfile(newProfile);
    saveAccountToList(newProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_PROFILE, JSON.stringify(newProfile));

    return {};
  };

  // Universal Sign In
  const signIn = async (email: string, pass: string) => {
    const cleanEmail = email.toLowerCase().trim();

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });

        if (!error && data.user) {
          setUser(data.user);
          const name = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Member';
          const avatar = data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`;
          
          const newProfile: UserProfile = {
            id: data.user.id,
            name,
            avatar,
            email: data.user.email,
            isGuest: false,
          };
          setProfile(newProfile);
          saveAccountToList(newProfile);
          localStorage.setItem(LOCAL_STORAGE_KEY_USER_PROFILE, JSON.stringify(newProfile));
          return {};
        }
      } catch {
        // fallback
      }
    }

    // Check saved local accounts list
    const storedAccounts = getStoredAccounts();
    const existing = storedAccounts.find((a) => a.email === cleanEmail);

    if (existing) {
      setProfile(existing);
      localStorage.setItem(LOCAL_STORAGE_KEY_USER_PROFILE, JSON.stringify(existing));
      return {};
    }

    // Create instant account if not found
    const fallbackName = cleanEmail.split('@')[0] || 'User';
    const fallbackProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
      email: cleanEmail,
      isGuest: false,
    };
    setProfile(fallbackProfile);
    saveAccountToList(fallbackProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_PROFILE, JSON.stringify(fallbackProfile));
    return {};
  };

  const signInGuest = (name: string, avatar?: string) => {
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const guestAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    
    const newProfile: UserProfile = {
      id: guestId,
      name,
      avatar: guestAvatar,
      isGuest: true,
    };
    setUser(null);
    setProfile(newProfile);
    saveAccountToList(newProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_PROFILE, JSON.stringify(newProfile));
  };

  const signOut = async () => {
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER_PROFILE);
  };

  const updateProfile = (name: string, avatar: string) => {
    setProfile((prev) => {
      const updated = prev ? { ...prev, name, avatar } : { id: `usr-${Date.now()}`, name, avatar };
      localStorage.setItem(LOCAL_STORAGE_KEY_USER_PROFILE, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoggedIn: Boolean(profile),
        isLoading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signInGuest,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
