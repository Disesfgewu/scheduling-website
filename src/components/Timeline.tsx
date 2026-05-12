'use client';

import { motion } from 'framer-motion';
import { Plus, CalendarDays } from 'lucide-react';
import { TimelineItem } from './TimelineItem';
import { Button } from './ui/button';
import { groupEventsByDate, sortedDates, formatDayLabel } from '@/lib/utils';
import { useTripStore } from '@/store/tripStore';
import { useUIStore } from '@/store/uiStore';
import type { TripDetailTab } from '@/store/uiStore';
import type { Trip } from '@/types';

interface TimelineProps {
  trip: Trip;
  readOnly?: boolean;
}

export function Timeline({ trip, readOnly = false }: TimelineProps) {
  const { selectedEventId, selectEvent, deleteEvent } = useTripStore();
  const { openAddCandidate, setActiveTripTab } = useUIStore();
  const grouped = groupEventsByDate(trip.events);
  const dates = sortedDates(grouped);

  const startDates = trip.startDate;

  if (trip.events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">No events yet</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {readOnly
            ? 'This invite link lets you preview the trip timeline in read-only mode.'
            : 'Add candidate places first, then schedule them into the timeline.'}
        </p>
        {!readOnly && (
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Button onClick={() => setActiveTripTab('candidates' as TripDetailTab)} size="lg">
              <CalendarDays className="h-4 w-4" />
              Go To Candidates
            </Button>
            <Button variant="outline" onClick={openAddCandidate} size="lg">
              <Plus className="h-4 w-4" />
              Add Candidate
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      {dates.map((date, dateIndex) => {
        const events = grouped[date];
        const dayIndex = Math.floor(
          (new Date(date).getTime() - new Date(startDates).getTime()) / (1000 * 60 * 60 * 24),
        );

        return (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: dateIndex * 0.06 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3 pl-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{dayIndex + 1}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatDayLabel(date, dayIndex)}
                </span>
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-1">
              {events.map((event, eventIndex) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  isSelected={selectedEventId === event.id}
                  isLast={eventIndex === events.length - 1 && dateIndex === dates.length - 1}
                  onClick={() => selectEvent(selectedEventId === event.id ? null : event.id)}
                  onDelete={readOnly ? undefined : () => deleteEvent(trip.id, event.id)}
                />
              ))}
            </div>
          </motion.div>
        );
      })}

      {!readOnly && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pl-4 mt-4"
        >
          <Button
            variant="outline"
            className="w-full border-dashed gap-2 h-11 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={openAddCandidate}
          >
            <Plus className="h-4 w-4" />
            Add Candidate
          </Button>
        </motion.div>
      )}
    </div>
  );
}
