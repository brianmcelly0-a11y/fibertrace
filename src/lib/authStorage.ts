import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id?: number;
  email: string;
  role: 'Technician' | 'TeamLead' | 'Manager';
  technicianId?: string;
  full_name?: string;
}

const AUTH_KEY = 'fibertrace_user';
const API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'https://api.fibertrace.app/api';

// Save user session
export async function saveUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user:', error);
  }
}

// Get current user
export async function getStoredUser(): Promise<User | null> {
  try {
    const data = await AsyncStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get stored user:', error);
    return null;
  }
}

// Logout
export async function clearUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error('Failed to clear user:', error);
  }
}

// Check if logged in
export async function isLoggedIn(): Promise<boolean> {
  const user = await getStoredUser();
  return !!user;
}

// Register new account via API
export async function registerAccount(fullName: string, email: string, password: string): Promise<User> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password_hash: password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

// Verify login credentials via API
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password_hash: password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Verification failed:', error);
    return null;
  }
}

// Reset password via API
export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, new_password_hash: newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset failed');
    }

    return true;
  } catch (error) {
    console.error('Password reset failed:', error);
    return false;
  }
}

// Fallback: Local verification (for offline mode)
export async function verifyCredentialsLocally(email: string, password: string): Promise<User | null> {
  try {
    const user = await getStoredUser();
    if (user && user.email === email) {
      // In real app, verify hashed password
      return user;
    }
    return null;
  } catch (error) {
    console.error('Local verification failed:', error);
    return null;
  }
}
