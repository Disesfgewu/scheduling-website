'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, ChevronDown, Trash2, Phone, Clock, DollarSign,
  Navigation, ExternalLink, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_CONFIG } from '@/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { openNavigation } from '@/lib/nominatim';
import type { TripEvent } from '@/types';

interface TimelineItemProps {
  event: TripEvent;
  isSelected: boolean;
  isLast: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export function TimelineItem({ event, isSelected, isLast, onClick, onDelete }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[event.category];

  const hasDetails = !!(
    event.notes || event.phone || event.website || event.openingHours ||
    event.priceNote || event.reservationRequired
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('relative flex gap-3 pl-4 cursor-pointer group', !isLast && 'pb-2')}
      onClick={onClick}
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[1.9rem] top-9 bottom-0 w-px bg-border" />
      )}

      {/* Time column */}
      <div className="w-12 shrink-0 pt-2 text-right">
        <span className="text-xs font-mono text-muted-foreground">{event.time}</span>
        {event.endTime && (
          <span className="block text-[10px] text-muted-foreground/60">{event.endTime}</span>
        )}
      </div>

      {/* Icon dot */}
      <div
        className={cn(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-1 transition-transform duration-200 group-hover:scale-110',
          config.bg,
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110',
        )}
      >
        <span className="text-sm">{event.icon}</span>
      </div>

      {/* Content card */}
      <div
        className={cn(
          'flex-1 min-w-0 rounded-xl p-3 border transition-all duration-200',
          isSelected
            ? 'bg-primary/5 border-primary/30 shadow-sm'
            : 'bg-card border-border hover:border-primary/20 hover:bg-accent/50',
        )}
      >
        {/* Main row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-foreground">{event.title}</span>
              <Badge className={cn('text-[10px] px-1.5 py-0 border-0', config.bg, config.color)}>
                {config.label}
              </Badge>
              {event.reservationRequired && (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0 gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />
                  需預約
                </Badge>
              )}
            </div>

            {event.location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{event.location.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* 導航按鈕：有地點就永遠顯示 */}
            {event.location && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-primary hover:bg-primary/10"
                title="導航"
                onClick={(e) => {
                  e.stopPropagation();
                  openNavigation(event.location!.lat, event.location!.lng);
                }}
              >
                <Navigation className="h-3.5 w-3.5" />
              </Button>
            )}
            {hasDetails && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              >
                <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Expandable details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                {event.notes && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{event.notes}</p>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {event.phone && (
                    <a
                      href={`tel:${event.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{event.phone}</span>
                    </a>
                  )}
                  {event.openingHours && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="truncate">{event.openingHours}</span>
                    </div>
                  )}
                  {event.priceNote && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground col-span-2">
                      <DollarSign className="h-3 w-3 shrink-0" />
                      <span>{event.priceNote}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {event.website && (
                    <a
                      href={event.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 rounded-lg">
                        <ExternalLink className="h-3 w-3" />
                        官網
                      </Button>
                    </a>
                  )}
                  {event.bookingUrl && (
                    <a
                      href={event.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button size="sm" className="h-7 text-xs gap-1 rounded-lg">
                        立即預訂
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
