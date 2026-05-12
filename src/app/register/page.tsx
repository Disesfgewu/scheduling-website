'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Compass, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('兩次密碼不一致'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = register(name, email, password);
    setLoading(false);
    if (result.ok) {
      router.push('/');
    } else {
      setError(result.error ?? '註冊失敗');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base">TripSync</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">建立帳號</h1>
            <p className="text-muted-foreground text-sm">加入 TripSync，開始規劃你的旅程</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">姓名</Label>
              <Input id="name" placeholder="你的名字" value={name}
                onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" placeholder="your@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-password">密碼</Label>
              <div className="relative">
                <Input id="reg-password" type={showPw ? 'text' : 'password'}
                  placeholder="至少 6 個字元" value={password}
                  onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">確認密碼</Label>
              <Input id="confirm" type={showPw ? 'text' : 'password'}
                placeholder="再輸入一次密碼" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} required />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {loading ? '建立中...' : '建立帳號'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            已經有帳號？{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              立即登入
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
