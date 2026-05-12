'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useUIStore } from '@/store/uiStore';
import { useTripStore } from '@/store/tripStore';
import { CATEGORY_CONFIG } from '@/types';

interface Props {
  tripId: string;
}

export function ScheduleModal({ tripId }: Props) {
  const { schedulingCandidateId, closeScheduleModal } = useUIStore();
  const { getCandidates, scheduleCandidate, getTrip } = useTripStore();

  const trip = getTrip(tripId);
  const candidates = getCandidates(tripId);
  const candidate = candidates.find((c) => c.id === schedulingCandidateId);

  const [date, setDate] = useState(trip?.startDate ?? '');
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!candidate) return null;

  const config = CATEGORY_CONFIG[candidate.category];

  const handleSchedule = async () => {
    if (!date || !time) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 200));
    await scheduleCandidate(tripId, candidate.id, date, time, endTime || undefined);
    setIsSaving(false);
    closeScheduleModal();
  };

  return (
    <Dialog open={!!schedulingCandidateId} onOpenChange={(open) => !open && closeScheduleModal()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>安排行程時間</DialogTitle>
        </DialogHeader>

        {/* Candidate info */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-muted"
        >
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
            <span className="text-lg">{config.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{candidate.name}</p>
            {candidate.address && (
              <p className="text-xs text-muted-foreground truncate">{candidate.address}</p>
            )}
            {candidate.openingHours && (
              <p className="text-xs text-muted-foreground">⏰ {candidate.openingHours}</p>
            )}
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sched-date">日期</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="sched-date"
                type="date"
                value={date}
                min={trip?.startDate}
                max={trip?.endDate}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sched-time">開始時間</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="sched-time" type="time" value={time}
                  onChange={(e) => setTime(e.target.value)} className="pl-9" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sched-end">結束時間</Label>
              <Input id="sched-end" type="time" value={endTime}
                onChange={(e) => setEndTime(e.target.value)} placeholder="選填" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeScheduleModal}>取消</Button>
          <Button onClick={handleSchedule} disabled={isSaving || !date || !time}>
            {isSaving ? '安排中...' : '確認安排'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
