import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id?: number;
  email: string;
  phone?: string;
  role: 'Technician' | 'TeamLead' | 'Manager' | 'Admin';
  technicianId?: string;
  full_name?: string;
}

const AUTH_KEY = 'fibertrace_user';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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

// Verify login credentials with retry logic and JWT token handling
export async function verifyCredentials(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  let lastError: string = '';
  
  // Try API with retry logic
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        // Store JWT token for future requests
        if (data.token) {
          await AsyncStorage.setItem('auth_token', data.token);
        }
        const user: User = {
          id: data.user.id,
          email: data.user.email,
          role: (data.user.role || 'Technician') as any,
          full_name: data.user.full_name,
          technicianId: `tech-${data.user.id || Date.now()}`,
        };
        return { success: true, user };
      }

      // Handle specific error responses
      if (response.status === 401) {
        return { success: false, error: 'Invalid credentials' };
      }
      if (response.status === 404) {
        return { success: false, error: 'User not found' };
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

  return { success: false, error: lastError || 'Login failed. Please check your credentials and try again.' };
}

// Helper function for delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Register new account
export async function registerAccount(fullName: string, email: string, password: string): Promise<User> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    // Store JWT token for future requests
    if (data.token) {
      await AsyncStorage.setItem('auth_token', data.token);
    }
    return data.user;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

// Reset password via API
export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, new_password: newPassword }),
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
