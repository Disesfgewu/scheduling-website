'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, Mail, Copy, Check, UserPlus, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

interface Props {
  tripId: string;
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ tripId, open, onClose }: Props) {
  const [tab, setTab] = useState<'link' | 'email'>('link');
  const [inviteUrl, setInviteUrl] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');

  const generateLink = useCallback(async () => {
    if (inviteUrl) return; // already generated
    setLinkLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/invite-link`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setInviteUrl(json.data.inviteUrl ?? '');
    } catch {
      setInviteUrl('');
    } finally {
      setLinkLoading(false);
    }
  }, [tripId, inviteUrl]);

  const handleTabChange = (t: 'link' | 'email') => {
    setTab(t);
    if (t === 'link') generateLink();
  };

  useEffect(() => {
    if (open && tab === 'link') {
      void generateLink();
    }
  }, [generateLink, open, tab]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailInvite = async () => {
    if (!email.trim()) return;
    setEmailLoading(true);
    setEmailStatus('idle');
    setEmailError('');
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '邀請失敗');
      setEmailStatus('success');
      setEmail('');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : '邀請失敗');
      setEmailStatus('error');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleClose = () => {
    setInviteUrl('');
    setCopied(false);
    setEmail('');
    setEmailStatus('idle');
    setEmailError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            邀請旅伴
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex rounded-xl bg-muted p-1 gap-1">
          {(['link', 'email'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                tab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'link' ? <Link2 className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
              {t === 'link' ? '邀請連結' : '輸入 Email'}
            </button>
          ))}
        </div>

        {tab === 'link' && (
          <motion.div
            key="link"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              分享此連結給旅伴，對方點擊後登入即可加入行程。連結 7 天內有效。
            </p>

            <div className="flex gap-2">
              <div className="flex-1 h-9 px-3 rounded-xl border border-border bg-muted text-xs flex items-center text-muted-foreground overflow-hidden">
                {linkLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="truncate">{inviteUrl || '生成中...'}</span>
                )}
              </div>
              <Button
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={handleCopy}
                disabled={!inviteUrl || linkLoading}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '已複製' : '複製'}
              </Button>
            </div>

            {copied && (
              <p className="text-xs text-green-600 dark:text-green-400 text-center">
                ✓ 連結已複製到剪貼簿
              </p>
            )}
          </motion.div>
        )}

        {tab === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              輸入對方已註冊的 Email，直接加入行程。
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailStatus('idle'); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailInvite()}
                />
                <Button
                  onClick={handleEmailInvite}
                  disabled={emailLoading || !email.trim()}
                  className="shrink-0 gap-1.5"
                >
                  {emailLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : emailStatus === 'success'
                    ? <Check className="h-3.5 w-3.5" />
                    : <UserPlus className="h-3.5 w-3.5" />}
                  {emailStatus === 'success' ? '已加入' : '邀請'}
                </Button>
              </div>
            </div>

            {emailStatus === 'error' && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
            {emailStatus === 'success' && (
              <p className="text-xs text-green-600 dark:text-green-400">✓ 對方已成功加入行程</p>
            )}
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
