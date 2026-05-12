'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListChecks, Plus, Phone, Globe, Clock, DollarSign,
  CalendarPlus, Trash2, CheckCircle2, MapPin, Filter,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTripStore } from '@/store/tripStore';
import { useUIStore } from '@/store/uiStore';
import { CATEGORY_CONFIG, PRICE_LEVEL_LABELS, type EventCategory } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  tripId: string;
}

const ALL_FILTER = 'all';

export function CandidateList({ tripId }: Props) {
  const { getCandidates, removeCandidate } = useTripStore();
  const { openAddCandidate, openScheduleModal } = useUIStore();
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'scheduled'>('all');

  const candidates = getCandidates(tripId);

  const filtered = candidates.filter((c) => {
    const catOk = categoryFilter === ALL_FILTER || c.category === categoryFilter;
    const statusOk =
      statusFilter === 'all' ||
      (statusFilter === 'scheduled' && !!c.scheduledEventId) ||
      (statusFilter === 'pending' && !c.scheduledEventId);
    return catOk && statusOk;
  });

  const pendingCount = candidates.filter((c) => !c.scheduledEventId).length;
  const scheduledCount = candidates.filter((c) => !!c.scheduledEventId).length;

  return (
    <div className="px-4 pb-28 pt-2">
      {/* Header stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'text-sm font-medium px-3 py-1 rounded-full transition-colors',
              statusFilter === 'all' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            全部 {candidates.length}
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={cn(
              'text-sm font-medium px-3 py-1 rounded-full transition-colors',
              statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            待安排 {pendingCount}
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className={cn(
              'text-sm font-medium px-3 py-1 rounded-full transition-colors',
              statusFilter === 'scheduled' ? 'bg-green-500 text-white' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            已安排 {scheduledCount}
          </button>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-2">
        <button
          onClick={() => setCategoryFilter(ALL_FILTER)}
          className={cn(
            'shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            categoryFilter === ALL_FILTER
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          <Filter className="h-3 w-3" />
          全類別
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(
          ([key, cfg]) => {
            const count = candidates.filter((c) => c.category === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={cn(
                  'shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  categoryFilter === key
                    ? `${cfg.bg} ${cfg.color} font-semibold`
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {cfg.icon} {cfg.label} {count}
              </button>
            );
          },
        )}
      </div>

      {/* Candidate cards */}
      <AnimatePresence>
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ListChecks className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">候選清單是空的</h3>
            <p className="text-sm text-muted-foreground mb-6">
              先把感興趣的地點加入候選，再安排到正式行程
            </p>
            <Button onClick={openAddCandidate} size="lg">
              <Plus className="h-4 w-4 mr-1" />
              新增候選地點
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((candidate, idx) => {
              const cfg = CATEGORY_CONFIG[candidate.category];
              const isScheduled = !!candidate.scheduledEventId;

              return (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  className={cn(
                    'rounded-2xl border p-4 transition-all duration-200',
                    isScheduled
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                      : 'bg-card border-border hover:shadow-card',
                  )}
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                      <span className="text-lg">{cfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{candidate.name}</span>
                        {isScheduled && (
                          <Badge variant="success" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            已安排
                          </Badge>
                        )}
                      </div>
                      {candidate.address && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">{candidate.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                    {candidate.phone && (
                      <a
                        href={`tel:${candidate.phone}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
                      >
                        <Phone className="h-3 w-3 shrink-0 group-hover:text-primary" />
                        <span className="truncate">{candidate.phone}</span>
                      </a>
                    )}
                    {candidate.website && (
                      <a
                        href={candidate.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">官方網站</span>
                      </a>
                    )}
                    {candidate.openingHours && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground col-span-2">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{candidate.openingHours}</span>
                      </div>
                    )}
                    {(candidate.priceNote || candidate.priceLevel) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground col-span-2">
                        <DollarSign className="h-3 w-3 shrink-0" />
                        <span>
                          {candidate.priceLevel && PRICE_LEVEL_LABELS[candidate.priceLevel]}
                          {candidate.priceLevel && candidate.priceNote && ' · '}
                          {candidate.priceNote}
                        </span>
                      </div>
                    )}
                  </div>

                  {candidate.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                      {candidate.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive gap-1.5 h-8 text-xs"
                      onClick={() => removeCandidate(tripId, candidate.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      移除
                    </Button>

                    {!isScheduled ? (
                      <Button
                        size="sm"
                        className="gap-1.5 h-8 text-xs"
                        onClick={() => openScheduleModal(candidate.id)}
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        安排行程
                      </Button>
                    ) : (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        ✓ 已加入行程
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Add more button */}
      {filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <Button
            variant="outline"
            className="w-full border-dashed gap-2 h-11 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={openAddCandidate}
          >
            <Plus className="h-4 w-4" />
            新增更多候選地點
          </Button>
        </motion.div>
      )}
    </div>
  );
}
