import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';
import { homePathFor, isHyperCoreAccount, roleNames } from '../lib/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Returns the resolved profile (or null). Callers that need to route on the
  // account's role cannot read `user` right after awaiting this — the state
  // update has not landed yet — so the profile is handed back directly.
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return null;
    }
    try {
      const res = await authApi.getMyProfile();
      const userData = res.data?.data || res.data;
      const permissions = (userData.roles || []).flatMap(
        (r) => (r.permessions || r.permissions || []).map((p) => p.name)
      );
      const resolved = { ...userData, permissions };
      setUser(resolved);
      return resolved;
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function login(identifier, password) {
    const res = await authApi.login(identifier, password);
    const { access_token, refresh_token, user: userData } = res.data;

    localStorage.setItem('auth_token', access_token);
    if (refresh_token) localStorage.setItem('refresh_token', refresh_token);

    // The login response carries no roles, so the profile call is what decides
    // which dashboard this account lands on.
    const profile = await fetchUser();
    return profile ?? userData;
  }

  async function register(name, email, password, passwordConfirmation) {
    const res = await authApi.register(name, email, password, passwordConfirmation);
    return res.data; // { message, user_id }
  }

  async function verifyOtp(userId, otp) {
    const res = await authApi.verifyOtp(userId, otp);
    const { access_token, user: userData } = res.data;

    if (access_token) {
      localStorage.setItem('auth_token', access_token);
      await fetchUser();
    }
    return userData;
  }

  async function resendOtp(userId) {
    const res = await authApi.resendOtp(userId);
    return res.data;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('active_project_key');
    setUser(null);
  }

  async function changePassword(currentPassword, newPassword, newPasswordConfirmation) {
    const res = await authApi.changePassword(currentPassword, newPassword, newPasswordConfirmation);
    return res.data;
  }

  function hasPermission(name) {
    return user?.permissions?.includes(name) ?? false;
  }

  function hasRole(name) {
    return roleNames(user).includes(name);
  }

  // Platform operator. The Auth Service seeds `hyper_core` with a null
  // project_id and only lets an existing hyper_core grant it, so holding the
  // role is what identifies the platform owner.
  const isHyperCore = isHyperCoreAccount(user);

  // Where this account belongs after signing in.
  const homePath = homePathFor(user);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
      changePassword,
      hasPermission,
      hasRole,
      isHyperCore,
      homePath,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
