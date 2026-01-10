import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Session } from '@supabase/supabase-js';
import { authHelpers } from '@/lib/supabase';
import { post } from '@/services/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Check for existing session
    authHelpers.getSession().then(({ session, error }) => {
      if (!error && session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    });

    // Subscribe to auth state changes
    const subscription = authHelpers.onAuthStateChange((session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const { data, error } = await authHelpers.signUp(email, password, fullName);

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      // Create user profile in backend MongoDB
      try {
        await post('/auth/create-profile', {
          userId: data.user.id,
          email: data.user.email,
          fullName: fullName || '',
        });
      } catch (backendError) {
        console.error('Failed to create backend profile:', backendError);
        // Don't throw - user is created in Supabase, profile creation can be retried
      }

      setSession(data.session);
      setUser(data.user);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await authHelpers.signIn(email, password);

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Failed to sign in');
      }

      // Update last login time in backend MongoDB
      try {
        await post('/auth/update-last-login', {
          userId: data.user.id,
        });
      } catch (backendError) {
        console.error('Failed to update last login:', backendError);
        // Don't throw - login is successful, this is just metadata
      }

      setSession(data.session);
      setUser(data.user);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await authHelpers.signOut();

      if (error) {
        throw new Error(error.message);
      }

      setSession(null);
      setUser(null);

      // Navigate to login
      navigate('/login');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
