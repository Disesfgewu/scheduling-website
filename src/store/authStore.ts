import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Supabase-ready: replace login/register/logout with supabase.auth calls ───

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  registeredUsers: AuthUser[];        // mock DB — replaced by Supabase
  passwords: Record<string, string>;  // mock — never do this in production

  isAuthenticated: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const DEMO_USERS: AuthUser[] = [
  { id: 'u1', name: 'Martin Chen', email: 'martin@demo.com', initials: 'MC', color: '#6366f1', createdAt: '2026-01-01' },
  { id: 'u2', name: 'Yuki Tanaka', email: 'yuki@demo.com', initials: 'YT', color: '#8b5cf6', createdAt: '2026-01-01' },
];
const DEMO_PASSWORDS: Record<string, string> = {
  'martin@demo.com': 'demo1234',
  'yuki@demo.com': 'demo1234',
};

function toInitials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#f43f5e'];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      registeredUsers: DEMO_USERS,
      passwords: DEMO_PASSWORDS,

      login: (email, password) => {
        const { registeredUsers, passwords } = get();
        const found = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!found) return { ok: false, error: '找不到此帳號，請先註冊' };
        if (passwords[found.email] !== password) return { ok: false, error: '密碼錯誤' };
        set({ user: found, isAuthenticated: true });
        return { ok: true };
      },

      register: (name, email, password) => {
        const { registeredUsers } = get();
        if (!name.trim()) return { ok: false, error: '請輸入姓名' };
        if (!email.includes('@')) return { ok: false, error: '請輸入有效的 Email' };
        if (password.length < 6) return { ok: false, error: '密碼至少 6 個字元' };
        if (registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return { ok: false, error: '此 Email 已被註冊' };
        }
        const newUser: AuthUser = {
          id: `u-${Date.now()}`,
          name: name.trim(),
          email: email.toLowerCase(),
          initials: toInitials(name),
          color: COLORS[registeredUsers.length % COLORS.length],
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((state) => ({
          registeredUsers: [...state.registeredUsers, newUser],
          passwords: { ...state.passwords, [newUser.email]: password },
          user: newUser,
          isAuthenticated: true,
        }));
        return { ok: true };
      },

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'tripsync-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        registeredUsers: state.registeredUsers,
        passwords: state.passwords,
      }),
    },
  ),
);
