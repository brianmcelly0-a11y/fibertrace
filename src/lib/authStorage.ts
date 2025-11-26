import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  email: string;
  role: 'Technician' | 'TeamLead' | 'Manager';
  technicianId: string;
}

export interface AuthAccount {
  email: string;
  password: string; // In production, use hashed passwords
  fullName: string;
  createdAt: string;
}

const AUTH_KEY = 'fibertrace_user';
const ACCOUNTS_KEY = 'fibertrace_accounts';

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

// Register new account
export async function registerAccount(fullName: string, email: string, password: string): Promise<AuthAccount> {
  try {
    const accounts = await getAccounts();
    const exists = accounts.find(a => a.email === email);
    
    if (exists) {
      throw new Error('Email already registered');
    }

    const newAccount: AuthAccount = {
      email,
      password,
      fullName,
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return newAccount;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

// Verify login credentials
export async function verifyCredentials(email: string, password: string): Promise<AuthAccount | null> {
  try {
    const accounts = await getAccounts();
    const account = accounts.find(a => a.email === email && a.password === password);
    return account || null;
  } catch (error) {
    console.error('Verification failed:', error);
    return null;
  }
}

// Get all accounts (for demo)
export async function getAccounts(): Promise<AuthAccount[]> {
  try {
    const data = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get accounts:', error);
    return [];
  }
}

// Reset password
export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
  try {
    const accounts = await getAccounts();
    const account = accounts.find(a => a.email === email);
    
    if (!account) {
      throw new Error('Account not found');
    }

    account.password = newPassword;
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return true;
  } catch (error) {
    console.error('Password reset failed:', error);
    return false;
  }
}
