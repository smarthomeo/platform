import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  image?: string;
  sub?: string;
  id?: string;
  is_host?: boolean;
  provider: 'google' | 'email';
  // New timestamp for caching
  lastProfileCheck?: number;
  about?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  getAuthHeader: () => { Authorization: string } | undefined;
  refreshUser: () => Promise<void>;
  session: Session | null;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

// Define the profile interface to match the database structure
interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  is_host: boolean;
  created_at?: string;
  updated_at?: string;
  is_admin?: boolean;
  about?: string;
}

// Cache timing configurations
const PROFILE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTH_STATE_DEBOUNCE = 1000; // 1 second

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Refs for debouncing and preventing duplicate requests
  const authStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingAuthChangeRef = useRef(false);
  
  // Cache for profile data
  const profileCache = useRef<Record<string, { profile: Profile; timestamp: number }>>({});

  const getAuthHeader = () => {
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
    return undefined;
  };

  // Extract user data from Supabase User object
  const extractUserData = (supabaseUser: User): AuthUser => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata.name || supabaseUser.user_metadata.full_name || '',
      picture: supabaseUser.user_metadata.picture || supabaseUser.user_metadata.avatar_url,
      is_host: supabaseUser.user_metadata.is_host || false,
      provider: supabaseUser.app_metadata.provider === 'google' ? 'google' : 'email',
      lastProfileCheck: Date.now(),
      about: supabaseUser.user_metadata.about
    };
  };

  // Debounced function to handle auth state changes
  const handleAuthStateChange = (currentSession: Session | null) => {
    // Clear any existing timeout
    if (authStateTimeoutRef.current) {
      clearTimeout(authStateTimeoutRef.current);
    }
    
    // If already processing a change, don't schedule another one
    if (processingAuthChangeRef.current) {
      return;
    }
    
    // Set a timeout to debounce multiple rapid auth state changes
    authStateTimeoutRef.current = setTimeout(() => {
      processingAuthChangeRef.current = true;
      
      if (currentSession?.user) {
        // Only update if we don't have a user or if the user ID changed
        if (!user || user.id !== currentSession.user.id) {
          const userData = extractUserData(currentSession.user);
          setUser(userData);
          setIsAuthenticated(true);
          setSession(currentSession);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setSession(null);
      }
      
      processingAuthChangeRef.current = false;
    }, AUTH_STATE_DEBOUNCE);
  };

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (mounted && currentSession?.user) {
          const userData = extractUserData(currentSession.user);
          setUser(userData);
          setIsAuthenticated(true);
          setSession(currentSession);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);
        
        if (mounted) {
          handleAuthStateChange(currentSession);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      // Clean up timeout and subscription
      if (authStateTimeoutRef.current) {
        clearTimeout(authStateTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log('Registering user with name:', name);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name, // Store name in user_metadata
            full_name: name, // Also store as full_name for compatibility
            is_host: false
          }
        }
      });

      if (error) throw error;

      // Log the user metadata that was set
      console.log('User registered with metadata:', data?.user?.user_metadata);

      toast.success('Registration successful!');
      
      // If email confirmation is enabled, show a message
      if (!data.session) {
        toast.info('Please check your email for a confirmation link.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // These state updates will be triggered by the onAuthStateChange listener
      // but we can also set them here for immediate UI feedback
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      
      // Clear the profile cache
      profileCache.current = {};
      
      toast.success('Successfully signed out!');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to logout');
    }
  };

  const refreshUser = async () => {
    try {
      if (!session?.user) return;
      
      const userId = session.user.id;
      const now = Date.now();
      
      // Get fresh profile data from the database
      console.log('Fetching fresh profile data');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
          
      if (!profileError && profile) {
        // Update user data with profile data
        const updatedUserData: AuthUser = {
          ...user!,
          is_host: profile.is_host,
          name: profile.name,
          picture: profile.avatar_url,
          lastProfileCheck: now,
          about: profile.about
        };
        
        // Cache the profile data
        profileCache.current[userId] = {
          profile: profile as Profile,
          timestamp: now
        };
        
        // Update local state without affecting the session
        setUser(updatedUserData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const setUserAndPersist = (newUser: AuthUser | null) => {
    setUser(newUser);
    setIsAuthenticated(!!newUser);
  };

  const resetPassword = async (email: string) => {
    try {
      // Use Supabase's password reset functionality
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email');
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      toast.success('Password updated successfully!');
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      setUser: setUserAndPersist,
      loginWithEmail,
      register,
      getAuthHeader, 
      logout,
      refreshUser,
      session,
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
