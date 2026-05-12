import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// ── Browser-side Supabase client（anon key，受 RLS 保護）──────
function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'tripsync' } },
  );
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  createdAt: string;
}

interface ProfileRow {
  id: string;
  name: string;
  initials: string;
  color: string;
  created_at: string;
}

function toAuthUser(userId: string, email: string, profile: ProfileRow): AuthUser {
  return {
    id: userId,
    name: profile.name,
    email,
    initials: profile.initials,
    color: profile.color,
    createdAt: profile.created_at,
  };
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // 頁面載入時呼叫，從 Supabase session 恢復登入狀態
  initialize: async () => {
    const supabase = getClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, initials, color, created_at')
      .eq('id', session.user.id)
      .single();

    set({
      user: profile ? toAuthUser(session.user.id, session.user.email ?? '', profile as ProfileRow) : null,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  login: async (email, password) => {
    const supabase = getClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message.includes('Invalid login credentials')
        ? '帳號或密碼錯誤'
        : error.message;
      return { ok: false, error: msg };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, initials, color, created_at')
      .eq('id', data.user.id)
      .single();

    set({
      user: profile ? toAuthUser(data.user.id, data.user.email ?? '', profile as ProfileRow) : null,
      isAuthenticated: true,
    });

    return { ok: true };
  },

  register: async (name, email, password) => {
    if (!name.trim()) return { ok: false, error: '請輸入姓名' };
    if (!email.includes('@')) return { ok: false, error: '請輸入有效的 Email' };
    if (password.length < 6) return { ok: false, error: '密碼至少 6 個字元' };

    const supabase = getClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    });

    if (error) {
      const msg = error.message.includes('already registered')
        ? '此 Email 已被註冊'
        : error.message;
      return { ok: false, error: msg };
    }

    // 若 Supabase 要求 Email 確認，session 會是 null
    if (!data.session) {
      return { ok: true, error: 'confirm_email' }; // 告訴 UI 顯示確認信提示
    }

    // 等 trigger 建立 profile（最多等 2 秒）
    await new Promise((r) => setTimeout(r, 800));
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, initials, color, created_at')
      .eq('id', data.user!.id)
      .single();

    set({
      user: profile ? toAuthUser(data.user!.id, data.user!.email ?? '', profile as ProfileRow) : null,
      isAuthenticated: true,
    });

    return { ok: true };
  },

  logout: async () => {
    await getClient().auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));
