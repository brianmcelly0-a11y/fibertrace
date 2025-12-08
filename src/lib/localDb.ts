// Local database logic using browser IndexedDB as example.
// Replace or adapt for mobile/Electron/local storage if needed.

export type User = {
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  otp?: string;
};

export type AdminConfig = {
  otpEnabled: boolean;
};

const USER_KEY = 'fibertrace_users';
const ADMIN_CONFIG_KEY = 'fibertrace_admin_config';

export function saveUser(user: User): void {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

export function getUsers(): User[] {
  const u = localStorage.getItem(USER_KEY);
  return u ? JSON.parse(u) : [];
}

export function saveAdminConfig(config: AdminConfig): void {
  localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
}

export function getAdminConfig(): AdminConfig {
  const c = localStorage.getItem(ADMIN_CONFIG_KEY);
  return c ? JSON.parse(c) : { otpEnabled: false };
}