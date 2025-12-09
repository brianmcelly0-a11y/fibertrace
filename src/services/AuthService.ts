import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDataService } from './LocalDataService';
import { db, generateId, User, Session } from '../lib/database';

const AUTH_KEYS = {
  currentSession: 'auth_current_session',
  currentUser: 'auth_current_user',
  rememberEmail: 'auth_remember_email',
};

class AuthService {
  private currentUser: User | null = null;
  private currentSession: Session | null = null;

  async initialize(): Promise<void> {
    await localDataService.initialize();
    await this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    try {
      const sessionData = await AsyncStorage.getItem(AUTH_KEYS.currentSession);
      const userData = await AsyncStorage.getItem(AUTH_KEYS.currentUser);

      if (sessionData && userData) {
        const session = JSON.parse(sessionData) as Session;
        const user = JSON.parse(userData) as User;

        if (new Date(session.expires_at) > new Date()) {
          this.currentSession = session;
          this.currentUser = user;
          localDataService.setCurrentContext(user.organization_id, user.id);
        } else {
          await this.logout();
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }

  async login(email: string, password: string, rememberMe = false): Promise<{ success: boolean; user?: User; error?: string; requiresOTP?: boolean }> {
    try {
      const user = await localDataService.verifyPassword(email, password);
      
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      if (!user.is_active) {
        return { success: false, error: 'Account is disabled' };
      }

      if (user.otp_enabled) {
        await AsyncStorage.setItem('auth_pending_otp_user', JSON.stringify(user));
        return { success: false, requiresOTP: true };
      }

      await this.createSession(user, rememberMe);
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  async verifyOTP(code: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const pendingUserData = await AsyncStorage.getItem('auth_pending_otp_user');
      if (!pendingUserData) {
        return { success: false, error: 'No pending OTP verification' };
      }

      const user = JSON.parse(pendingUserData) as User;

      const isValid = this.validateOTPCode(user.otp_secret || '', code);
      if (!isValid) {
        return { success: false, error: 'Invalid OTP code' };
      }

      await AsyncStorage.removeItem('auth_pending_otp_user');
      await this.createSession(user, false);
      return { success: true, user };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: 'OTP verification failed' };
    }
  }

  private validateOTPCode(secret: string, code: string): boolean {
    const now = Math.floor(Date.now() / 30000);
    for (let i = -1; i <= 1; i++) {
      const expectedCode = this.generateTOTP(secret, now + i);
      if (expectedCode === code) {
        return true;
      }
    }
    return false;
  }

  private generateTOTP(secret: string, counter: number): string {
    const digits = 6;
    const hash = this.simpleHash(secret + counter.toString());
    const code = Math.abs(hash % Math.pow(10, digits));
    return code.toString().padStart(digits, '0');
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  private async createSession(user: User, rememberMe: boolean): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1));

    const session: Session = {
      id: generateId(),
      user_id: user.id,
      token: generateId() + '_' + generateId(),
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    };

    await db.saveSession(session);
    await AsyncStorage.setItem(AUTH_KEYS.currentSession, JSON.stringify(session));
    await AsyncStorage.setItem(AUTH_KEYS.currentUser, JSON.stringify(user));

    if (rememberMe) {
      await AsyncStorage.setItem(AUTH_KEYS.rememberEmail, user.email);
    }

    this.currentSession = session;
    this.currentUser = user;
    localDataService.setCurrentContext(user.organization_id, user.id);
  }

  async register(data: {
    organizationName: string;
    organizationCode: string;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const existingUser = await localDataService.getUserByEmail(data.email);
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      const organization = await localDataService.createOrganization(
        data.organizationName,
        data.organizationCode
      );

      const user = await localDataService.createUser({
        organizationId: organization.id,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: 'Admin',
        phone: data.phone,
      });

      await this.createSession(user, false);
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.currentSession) {
        await db.deleteSession(this.currentSession.id);
      }
      await AsyncStorage.removeItem(AUTH_KEYS.currentSession);
      await AsyncStorage.removeItem(AUTH_KEYS.currentUser);
      this.currentSession = null;
      this.currentUser = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'Not logged in' };
      }

      const verified = await localDataService.verifyPassword(this.currentUser.email, currentPassword);
      if (!verified) {
        return { success: false, error: 'Current password is incorrect' };
      }

      await localDataService.updateUser(this.currentUser.id, {
        password_hash: newPassword,
      });

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await localDataService.getUserByEmail(email);
      if (!user) {
        return { success: true };
      }

      const resetCode = Math.random().toString(36).substr(2, 8).toUpperCase();
      await AsyncStorage.setItem(`reset_${email.toLowerCase()}`, JSON.stringify({
        code: resetCode,
        expires: Date.now() + 3600000,
      }));

      console.log(`Password reset code for ${email}: ${resetCode}`);
      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: 'Failed to process reset request' };
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const resetData = await AsyncStorage.getItem(`reset_${email.toLowerCase()}`);
      if (!resetData) {
        return { success: false, error: 'Invalid or expired reset code' };
      }

      const { code: storedCode, expires } = JSON.parse(resetData);
      if (Date.now() > expires || code !== storedCode) {
        return { success: false, error: 'Invalid or expired reset code' };
      }

      const user = await localDataService.getUserByEmail(email);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      await localDataService.updateUser(user.id, {
        password_hash: newPassword,
      });

      await AsyncStorage.removeItem(`reset_${email.toLowerCase()}`);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Failed to reset password' };
    }
  }

  async setupOTP(): Promise<{ success: boolean; secret?: string; error?: string }> {
    if (!this.currentUser) {
      return { success: false, error: 'Not logged in' };
    }

    const secret = this.generateOTPSecret();
    return { success: true, secret };
  }

  async confirmOTPSetup(secret: string, code: string): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) {
      return { success: false, error: 'Not logged in' };
    }

    const isValid = this.validateOTPCode(secret, code);
    if (!isValid) {
      return { success: false, error: 'Invalid OTP code' };
    }

    await localDataService.enableOTP(this.currentUser.id, secret);
    this.currentUser.otp_enabled = true;
    await AsyncStorage.setItem(AUTH_KEYS.currentUser, JSON.stringify(this.currentUser));

    return { success: true };
  }

  async disableOTP(password: string): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) {
      return { success: false, error: 'Not logged in' };
    }

    const verified = await localDataService.verifyPassword(this.currentUser.email, password);
    if (!verified) {
      return { success: false, error: 'Incorrect password' };
    }

    await localDataService.disableOTP(this.currentUser.id);
    this.currentUser.otp_enabled = false;
    await AsyncStorage.setItem(AUTH_KEYS.currentUser, JSON.stringify(this.currentUser));

    return { success: true };
  }

  private generateOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'Admin';
  }

  isManager(): boolean {
    return this.currentUser?.role === 'Admin' || this.currentUser?.role === 'Manager';
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;

    const rolePermissions: Record<string, string[]> = {
      Admin: ['*'],
      Manager: ['jobs', 'inventory', 'users.view', 'reports', 'announcements'],
      Technician: ['jobs.own', 'inventory.view', 'announcements.view'],
      Viewer: ['jobs.view', 'inventory.view', 'announcements.view'],
    };

    const userPermissions = rolePermissions[this.currentUser.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }

  async getRememberedEmail(): Promise<string | null> {
    return AsyncStorage.getItem(AUTH_KEYS.rememberEmail);
  }

  async clearRememberedEmail(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_KEYS.rememberEmail);
  }
}

export const authService = new AuthService();
export default authService;
