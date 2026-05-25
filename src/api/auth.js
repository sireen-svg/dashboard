import { authClient } from './client';

// --- Public endpoints (no token required) ---
export const login = (identifier, password) =>
  authClient.post('/login', { identifier, password });

export const register = (name, email, password, password_confirmation) =>
  authClient.post('/register', { name, email, password, password_confirmation });

export const verifyOtp = (userId, otp) =>
  authClient.post('/verify-otp', { user_id: userId, otp });

export const resendOtp = (userId) =>
  authClient.post('/resend-otp', { user_id: userId });

export const refreshToken = (refresh_token) =>
  authClient.post('/refresh', { refresh_token });

// --- Protected endpoints (token required) ---
export const getMyProfile = () =>
  authClient.get('/my-profile');

export const logout = () =>
  authClient.post('/logout');

export const changePassword = (current_password, new_password, new_password_confirmation) =>
  authClient.post('/change-password', {
    current_password,
    new_password,
    new_password_confirmation,
  });

// --- Admin: User & Role Management (super_admin / admin) ---
export const getAllUsers = () =>
  authClient.get('/get-all-users');

export const assignRoleToUser = (user_id, role_id) =>
  authClient.post('/assign-role-to-user', { user_id, role_id });

export const removeRoleFromUser = (user_id) =>
  authClient.post('/remove-role-from-user', { user_id });

// --- Admin: Permission Management (super_admin only) ---
export const addPermission = (permession) =>
  authClient.post('/add-permession', { permession });

export const assignPermissionToRole = (permession_id, role_id) =>
  authClient.post('/assign-permession-to-role', { permession_id, role_id });

export const removePermissionFromRole = (permession_id, role_id) =>
  authClient.post('/remove-permession-from-role', { permession_id, role_id });
