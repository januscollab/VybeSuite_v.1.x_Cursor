import * as fs from 'fs';

const content = `import { debug } from '../utils/debug';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{
        error: AuthError | null;
    }>;
    signUp: (email: string, password: string) => Promise<{
        error: AuthError | null;
    }>;
    signOut: () => Promise<{
        error: AuthError | null;
    }>;
    resetPassword: (email: string) => Promise<{
        error: AuthError | null;
    }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    debug.error("AuthContext", "Error getting session", { error });
                    // Handle invalid refresh token errors by clearing the session
                    if (error.message?.includes('Invalid Refresh Token') ||
                        error.message?.includes('refresh_token_not_found') ||
                        error.code === 'refresh_token_not_found') {
                        debug.info("AuthContext", 'Invalid refresh token detected, clearing session...');
                        await supabase.auth.signOut();
                        setSession(null);
                        setUser(null);
                    }
                } else {
                    setSession(session);
                    setUser(session?.user ?? null);
                }
            } catch (error) {
                debug.error("AuthContext", "Error in getInitialSession", { error });
                // Handle any other authentication errors by clearing the session
                debug.info("AuthContext", 'Authentication error detected, clearing session...');
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            debug.info("AuthContext", "Auth state changed", { event, sessionEmail: session?.user?.email });
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            return { error };
        } catch (error) {
            debug.error("AuthContext", "Sign in error", { error });
            return { error: error as AuthError };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            setLoading(true);
            debug.info("AuthContext", "Attempting signup for", { email });
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: \`\${window.location.origin}/auth/callback\`,
                    data: {
                        email_confirmed: false
                    }
                }
            });
            debug.info("AuthContext", "Signup response", { 
                userId: data.user?.id,
                session: !!data.session,
                error: error?.message
            });

            if (error) {
                if (error.message === 'User already registered' || error.code === 'user_already_exists') {
                    debug.warn("AuthContext", "Signup attempt with existing email", { email });
                } else {
                    debug.error("AuthContext", "Signup error details", { error });
                }
                return { error };
            }

            debug.info("AuthContext", "User successfully created", { userEmail: data.user?.email });
            return { error: null };
        } catch (error) {
            debug.error("AuthContext", "Signup exception", { error });
            return { error: error as AuthError };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signOut();
            return { error };
        } catch (error) {
            debug.error("AuthContext", "Sign out error", { error });
            return { error: error as AuthError };
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: \`\${window.location.origin}/auth/reset-password\`
            });
            return { error };
        } catch (error) {
            debug.error("AuthContext", "Reset password error", { error });
            return { error: error as AuthError };
        }
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};`;

fs.writeFileSync('./src/contexts/AuthContext.tsx', content);
console.log('Fixed AuthContext.tsx');
