'use client';

import { motion } from 'framer-motion';
import { CalendarDays, Map, Users, ListChecks, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type TripDetailTab } from '@/store/uiStore';
import { useTripStore } from '@/store/tripStore';
import { Button } from './ui/button';

interface NavItem {
  id: TripDetailTab;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'timeline', label: '行程', icon: CalendarDays },
  { id: 'candidates', label: '候選', icon: ListChecks },
  { id: 'map', label: '地圖', icon: Map },
  { id: 'members', label: '成員', icon: Users },
];

interface BottomNavigationProps {
  tripId: string;
}

export function BottomNavigation({ tripId }: BottomNavigationProps) {
  const { activeTripTab, setActiveTripTab, openAddCandidate } = useUIStore();
  const { getCandidates } = useTripStore();
  const pendingCount = getCandidates(tripId).filter((c) => !c.scheduledEventId).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="glass border-t border-border/50 px-2 py-1.5">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTripTab === item.id;
            const showBadge = item.id === 'candidates' && pendingCount > 0;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTripTab(item.id)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-bg"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <Icon className="relative h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </div>
                <span className="relative text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Context-aware FAB */}
          <Button
            size="icon-lg"
            className="rounded-2xl bg-primary text-white shadow-lg hover:shadow-xl hover:bg-primary/90 h-11 w-11 shrink-0"
            onClick={openAddCandidate}
            title="新增候選地點"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
