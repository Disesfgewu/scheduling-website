'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MapPin, Compass, LogOut } from 'lucide-react';
import { TripCard } from '@/components/TripCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CreateTripModal } from '@/components/CreateTripModal';
import { AuthGuard } from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTripStore } from '@/store/tripStore';
import { useAuthStore } from '@/store/authStore';

const FILTERS = ['全部', '即將出發', '進行中', '已完成'] as const;
type Filter = (typeof FILTERS)[number];

export default function HomePage() {
  const router = useRouter();
  const { trips, loadTrips, hasLoadedTrips, isTripsLoading, tripsError } = useTripStore();
  const { user, logout } = useAuthStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('全部');
  const [createOpen, setCreateOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/login'); };

  useEffect(() => {
    if (!hasLoadedTrips) {
      void loadTrips();
    }
  }, [hasLoadedTrips, loadTrips]);

  const filtered = trips.filter((trip) => {
    const matchSearch =
      search.trim() === '' ||
      trip.title.includes(search) ||
      trip.location.includes(search) ||
      trip.country.includes(search);
    return matchSearch;
  });

  return (
    <AuthGuard>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 glass border-b border-border/50"
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                <Compass className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">TripSync</h1>
                <p className="text-[10px] text-muted-foreground leading-tight">共享行程安排</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                新行程
              </Button>
              {user && (
                <button onClick={handleLogout} title={`登出 ${user.name}`}
                  className="ml-1 flex items-center gap-1 group">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] font-bold text-white"
                      style={{ backgroundColor: user.color }}>
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <LogOut className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 pb-8">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="py-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-1">
            你的旅行，
            <span className="text-gradient"> 完美規劃</span>
          </h2>
          <p className="text-muted-foreground text-sm">與朋友共同規劃，隨時同步行程</p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="relative mb-4"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋行程、城市..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-card"
          />
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1"
        >
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === filter
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex items-center gap-4 mb-6 px-1"
        >
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{filtered.length} 個行程</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span className="text-sm text-muted-foreground">
            {trips.reduce((acc, t) => acc + t.events.length, 0)} 個活動
          </span>
        </motion.div>

        {/* Trip cards */}
        <AnimatePresence mode="popLayout">
          {isTripsLoading && trips.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading trips...</p>
            </motion.div>
          ) : tripsError && trips.length === 0 ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <h3 className="font-semibold mb-1">Unable to load trips</h3>
              <p className="text-sm text-muted-foreground">{tripsError}</p>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">找不到相符行程</h3>
              <p className="text-sm text-muted-foreground">請嘗試不同的關鍵字</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filtered.map((trip, index) => (
                <TripCard key={trip.id} trip={trip} index={index} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Bottom padding for safe area */}
        <div className="h-8" />
      </main>

      <CreateTripModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
    </AuthGuard>
  );
}
