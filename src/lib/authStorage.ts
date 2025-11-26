import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  email: string;
  role: 'Technician' | 'TeamLead' | 'Manager';
  technicianId: string;
}

const AUTH_KEY = 'fibertrace_user';

export async function saveUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user:', error);
  }
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const data = await AsyncStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get stored user:', error);
    return null;
  }
}

export async function clearUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error('Failed to clear user:', error);
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const user = await getStoredUser();
  return !!user;
}
