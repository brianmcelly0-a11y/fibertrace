import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id?: number;
  email: string;
  role: 'Technician' | 'TeamLead' | 'Manager' | 'Admin';
  technicianId?: string;
  full_name?: string;
}

const AUTH_KEY = 'fibertrace_user';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Built-in test credentials for offline-first development
const TEST_CREDENTIALS = [
  { email: 'admin@fibertrace.app', password: 'admin123456', role: 'Admin', full_name: 'Admin User' },
  { email: 'john@fibertrace.app', password: 'tech123456', role: 'Technician', full_name: 'John Technician' },
  { email: 'jane@fibertrace.app', password: 'field123456', role: 'Technician', full_name: 'Jane Field' },
];

// Save user session
export async function saveUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user:', error);
    throw new Error('Failed to save session. Please try again.');
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

// Verify login credentials with retry logic and offline fallback
export async function verifyCredentials(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  // First try test credentials (offline-first)
  const testUser = TEST_CREDENTIALS.find(
    t => t.email.toLowerCase() === email.toLowerCase() && t.password === password
  );

  if (testUser) {
    const user: User = {
      email: testUser.email,
      role: testUser.role as any,
      full_name: testUser.full_name,
      technicianId: `tech-${Date.now()}`,
    };
    return { success: true, user };
  }

  // Try API with retry logic
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.fibertrace.app/api';
      
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password_hash: password }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        const user: User = {
          email: data.user.email,
          role: data.user.role || 'Technician',
          full_name: data.user.full_name,
          technicianId: `tech-${data.user.id || Date.now()}`,
        };
        return { success: true, user };
      }

      // Handle specific error responses
      if (response.status === 401) {
        return { success: false, error: 'Wrong Password' };
      }
      if (response.status === 404) {
        return { success: false, error: 'Account Not Found' };
      }

      lastError = `Server error: ${response.status}`;
      
      // Retry after delay on server errors
      if (attempt < MAX_RETRIES && response.status >= 500) {
        await delay(RETRY_DELAY * attempt);
        continue;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error';
      
      // Retry on network errors
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY * attempt);
        continue;
      }
    }
  }

  // If all API attempts fail, check local storage as last resort
  const storedUser = await getStoredUser();
  if (storedUser && storedUser.email.toLowerCase() === email.toLowerCase()) {
    // Allow offline login with previously stored credentials
    return { success: true, user: storedUser };
  }

  return { success: false, error: lastError || 'Login failed. Please check your credentials and try again.' };
}

// Helper function for delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Register new account
export async function registerAccount(fullName: string, email: string, password: string): Promise<User> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.fibertrace.app/api';
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password_hash: password }),
      signal: AbortSignal.timeout(5000),
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

// Reset password via API
export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.fibertrace.app/api';
    const response = await fetch(`${apiUrl}/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, new_password_hash: newPassword }),
      signal: AbortSignal.timeout(5000),
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
