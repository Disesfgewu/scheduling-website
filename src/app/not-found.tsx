import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-6">🗺️</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">找不到這個行程</h1>
      <p className="text-muted-foreground mb-8">該行程可能已被刪除或連結無效</p>
      <Button asChild>
        <Link href="/">返回行程列表</Link>
      </Button>
    </div>
  );
}
