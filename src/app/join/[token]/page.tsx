'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function JoinPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { user, isLoading, initialize } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [tripId, setTripId] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;

    // 未登入 → 帶 redirect 去登入頁
    if (!user) {
      router.replace(`/login?redirect=/join/${token}`);
      return;
    }

    // 已登入 → 呼叫 API 加入行程
    fetch(`/api/join/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setTripId(json.data.tripId);
        setStatus('success');
      })
      .catch((err) => {
        setErrorMsg(err.message ?? '加入失敗');
        setStatus('error');
      });
  }, [isLoading, user, token, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm w-full"
      >
        <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
          <Compass className="h-7 w-7 text-white" />
        </div>

        {status === 'loading' && (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">正在加入行程...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">成功加入行程！</h2>
            <p className="text-muted-foreground text-sm mb-6">你已成為這個行程的成員</p>
            <Button className="w-full" onClick={() => router.push(`/trips/${tripId}`)}>
              前往行程 →
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">無法加入</h2>
            <p className="text-muted-foreground text-sm mb-6">{errorMsg}</p>
            <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
              返回首頁
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
