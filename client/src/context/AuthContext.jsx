import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client.js';
import { triggerGoogleSignIn } from '../config/firebase.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('eventpulse_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('eventpulse_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync session on initial load
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/api/auth/me');
        if (res.data?.data?.user) {
          setUser(res.data.data.user);
          localStorage.setItem('eventpulse_user', JSON.stringify(res.data.data.user));
        }
      } catch (err) {
        // Token invalid or expired
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [token]);

  const saveAuthSession = (authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem('eventpulse_token', authToken);
    localStorage.setItem('eventpulse_user', JSON.stringify(authUser));
  };

  const login = async (email, password) => {
    const res = await apiClient.post('/api/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data.data;
    saveAuthSession(newToken, newUser);
    return newUser;
  };

  const register = async (name, email, password) => {
    const res = await apiClient.post('/api/auth/register', { name, email, password });
    const { token: newToken, user: newUser } = res.data.data;
    saveAuthSession(newToken, newUser);
    return newUser;
  };

  const loginWithGoogle = async () => {
    const { idToken } = await triggerGoogleSignIn();
    const res = await apiClient.post('/api/auth/google', { idToken });
    const { token: newToken, user: newUser } = res.data.data;
    saveAuthSession(newToken, newUser);
    return newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('eventpulse_token');
    localStorage.removeItem('eventpulse_user');
    apiClient.post('/api/auth/logout').catch(() => {});
  };

  const updateProfile = async ({ name, city }) => {
    const res = await apiClient.patch('/api/users/me', { name, city });
    const updated = res.data.data.user;
    setUser(updated);
    localStorage.setItem('eventpulse_user', JSON.stringify(updated));
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
