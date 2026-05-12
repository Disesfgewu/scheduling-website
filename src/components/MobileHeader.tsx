'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  transparent?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

export function MobileHeader({
  title,
  showBack = true,
  transparent = false,
  className,
  actions,
}: MobileHeaderProps) {
  const router = useRouter();

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between px-4 gap-3',
        transparent
          ? 'bg-transparent'
          : 'glass border-b border-border/50',
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0 -ml-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {title && (
          <h1 className="font-semibold text-base truncate text-foreground">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {actions}
      </div>
    </motion.header>
  );
}
