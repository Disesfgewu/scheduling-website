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
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      let { data: profile } = await supabase
        .from('profiles')
        .select('id, name, initials, color, created_at')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        // Profile 不存在（trigger 未跑），自動建立
        const name = session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'User';
        const initials = name.slice(0, 2).toUpperCase();
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        await supabase.from('profiles').upsert(
          { id: session.user.id, name, initials, color },
          { onConflict: 'id' },
        );
        profile = { id: session.user.id, name, initials, color, created_at: new Date().toISOString() };
      }

      set({
        user: toAuthUser(session.user.id, session.user.email ?? '', profile as ProfileRow),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
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

    // 嘗試取得 profile，若不存在則用 auth user 資料建立基本 profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, name, initials, color, created_at')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      // Trigger 可能還沒跑，手動建立 profile
      const name = data.user.user_metadata?.name ?? email.split('@')[0];
      const initials = name.slice(0, 2).toUpperCase();
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      await supabase.from('profiles').upsert(
        { id: data.user.id, name, initials, color },
        { onConflict: 'id' },
      );
      profile = { id: data.user.id, name, initials, color, created_at: new Date().toISOString() };
    }

    set({
      user: toAuthUser(data.user.id, data.user.email ?? '', profile as ProfileRow),
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
      return { ok: true, error: 'confirm_email' };
    }

    // 等 trigger 建立 profile（最多等 1 秒）
    await new Promise((r) => setTimeout(r, 1000));
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, name, initials, color, created_at')
      .eq('id', data.user!.id)
      .single();

    if (!profile) {
      // Trigger 未跑，手動建立 profile
      const initials = name.trim().slice(0, 2).toUpperCase();
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      await supabase.from('profiles').upsert(
        { id: data.user!.id, name: name.trim(), initials, color },
        { onConflict: 'id' },
      );
      profile = { id: data.user!.id, name: name.trim(), initials, color, created_at: new Date().toISOString() };
    }

    set({
      user: toAuthUser(data.user!.id, data.user!.email ?? '', profile as ProfileRow),
      isAuthenticated: true,
    });

    return { ok: true };
  },

  logout: async () => {
    await getClient().auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));
