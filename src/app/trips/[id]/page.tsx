'use client';

import { use, useEffect, useRef, useState } from 'react';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Share2, MoreHorizontal, Crown, UserPlus, LogIn } from 'lucide-react';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Timeline } from '@/components/Timeline';
import { CandidateList } from '@/components/CandidateList';
import { AddCandidateModal } from '@/components/AddCandidateModal';
import { ScheduleModal } from '@/components/ScheduleModal';
import { InviteModal } from '@/components/InviteModal';
import { MemberAvatar, MemberStack } from '@/components/MemberAvatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTripStore } from '@/store/tripStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { formatDateRange } from '@/lib/utils';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted rounded-2xl">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm">載入地圖中...</span>
      </div>
    </div>
  ),
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TripDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const {
    getTrip,
    selectedEventId,
    selectEvent,
    getCandidates,
    loadTrip,
    loadSharedTrip,
    hasLoadedTrip,
    isTripLoading,
    isTripMissing,
    getTripError,
  } = useTripStore();
  const { activeTripTab, setActiveTripTab } = useUIStore();
  const { user, isAuthenticated, isLoading: isAuthLoading, initialize } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isInviteReadOnly, setIsInviteReadOnly] = useState(false);
  const [isAutoJoining, setIsAutoJoining] = useState(false);
  const [inviteJoinError, setInviteJoinError] = useState('');
  const autoJoinKeyRef = useRef<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated && token) {
      setIsInviteReadOnly(true);
      void loadSharedTrip(id, token);
      return;
    }

    setIsInviteReadOnly(false);

    if (!isAuthenticated) {
      const redirect = encodeURIComponent(`/trips/${id}`);
      router.replace(`/login?redirect=${redirect}`);
      return;
    }

    void loadTrip(id);
  }, [id, isAuthenticated, isAuthLoading, loadSharedTrip, loadTrip, router, token]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const joinKey = `${user.id}:${token}`;
    if (autoJoinKeyRef.current === joinKey) {
      return;
    }

    autoJoinKeyRef.current = joinKey;
    setIsAutoJoining(true);
    setInviteJoinError('');

    void fetch(`/api/join/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? 'Failed to join trip');
        }
      })
      .catch((error) => {
        setInviteJoinError(error instanceof Error ? error.message : 'Failed to join trip');
      })
      .finally(() => {
        setIsAutoJoining(false);
        void loadTrip(id, true);
      });
  }, [id, loadTrip, token, user]);

  useEffect(() => {
    if (isInviteReadOnly && activeTripTab !== 'timeline' && activeTripTab !== 'map') {
      setActiveTripTab('timeline');
    }
  }, [activeTripTab, isInviteReadOnly, setActiveTripTab]);

  const trip = getTrip(id);
  const tripError = getTripError(id);
  const loginRedirect = `/login?redirect=${encodeURIComponent(
    token ? `/trips/${id}?token=${token}` : `/trips/${id}`,
  )}`;

  if (!trip) {
    if (tripError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
          <div>
            <h1 className="font-semibold text-foreground mb-2">Unable to load trip</h1>
            <p className="text-sm text-muted-foreground">{tripError}</p>
          </div>
        </div>
      );
    }

    if (isTripMissing(id) && hasLoadedTrip(id)) {
      notFound();
    }

    if (isTripLoading(id) || !hasLoadedTrip(id)) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm">Loading trip...</span>
          </div>
        </div>
      );
    }

    notFound();
  }

  const eventsWithLocation = trip.events.filter((e) => e.location);
  const pendingCandidates = getCandidates(id).filter((c) => !c.scheduledEventId).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <MobileHeader
        title={trip.title}
        actions={
          <>
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* Hero Image */}
      <div className="relative h-48 shrink-0 overflow-hidden">
        {trip.coverImage ? (
          <Image
            src={trip.coverImage}
            alt={trip.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            unoptimized={trip.coverImage.startsWith('data:')}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-7xl drop-shadow-lg">{trip.emoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xl">{trip.emoji}</span>
                <h1 className="text-white font-bold text-lg leading-tight">{trip.title}</h1>
              </div>
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                <span>{trip.location}, {trip.country}</span>
              </div>
            </div>
            <MemberStack members={trip.members} max={4} size="sm" />
          </div>
        </div>
      </div>

      {/* Trip info card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="mx-4 -mt-3 relative z-10 bg-card rounded-2xl border border-border shadow-card p-3 mb-3"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{formatDateRange(trip.startDate, trip.endDate)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="font-bold text-base text-foreground">{trip.events.length}</div>
              <div className="text-[10px]">行程</div>
            </div>
            {!isInviteReadOnly && pendingCandidates > 0 && (
              <div className="text-center">
                <div className="font-bold text-base text-amber-500">{pendingCandidates}</div>
                <div className="text-[10px]">候選</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {isInviteReadOnly && (
        <div className="mx-4 mb-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Read-only invite preview</p>
              <p className="text-xs text-muted-foreground mt-1">
                You can view the timeline and map with this invite link. Log in to join the trip and unlock editing.
              </p>
            </div>
            <Button size="sm" className="gap-1.5 shrink-0" onClick={() => router.push(loginRedirect)}>
              <LogIn className="h-3.5 w-3.5" />
              Log In
            </Button>
          </div>
        </div>
      )}

      {token && isAuthenticated && (isAutoJoining || inviteJoinError) && (
        <div className="mx-4 mb-3 rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            {isAutoJoining ? 'Joining trip from invite link...' : 'Invite link could not auto-join this account.'}
          </p>
          {inviteJoinError && (
            <p className="text-xs text-muted-foreground mt-1">{inviteJoinError}</p>
          )}
        </div>
      )}

      {isInviteReadOnly && (
        <div className="mx-4 mb-3">
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            {(['timeline', 'map'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTripTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTripTab === tab
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'timeline' ? 'Timeline' : 'Map'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTripTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22 }}
              className="h-full overflow-y-auto pt-1"
            >
              <Timeline trip={trip} readOnly={isInviteReadOnly} />
            </motion.div>
          )}

          {!isInviteReadOnly && activeTripTab === 'candidates' && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.22 }}
              className="h-full overflow-y-auto"
            >
              <CandidateList tripId={trip.id} />
            </motion.div>
          )}

          {activeTripTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className="h-full p-4 pb-28"
            >
              <div className="h-full rounded-2xl overflow-hidden border border-border shadow-card">
                <MapView
                  events={eventsWithLocation}
                  selectedEventId={selectedEventId}
                  onMarkerClick={selectEvent}
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          )}

          {!isInviteReadOnly && activeTripTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="h-full overflow-y-auto px-4 pt-2 pb-28"
            >
              <h2 className="font-semibold text-foreground mb-4">成員 · {trip.members.length} 人</h2>

              {/* Member list */}
              <div className="space-y-2 mb-6">
                {trip.members.map((member, idx) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:shadow-card transition-shadow"
                  >
                    <MemberAvatar member={member} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{member.user.name}</span>
                        {member.role === 'owner' && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                    <Badge variant={member.role === 'owner' ? 'default' : member.role === 'editor' ? 'secondary' : 'outline'}>
                      {member.role === 'owner' ? '擁有者' : member.role === 'editor' ? '編輯者' : '檢視者'}
                    </Badge>
                  </motion.div>
                ))}
              </div>

              <Button
                className="w-full gap-2 mt-2"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                邀請旅伴
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isInviteReadOnly && (
        <>
          {/* Bottom Navigation */}
          <BottomNavigation tripId={trip.id} />

          {/* Modals */}
          <AddCandidateModal tripId={trip.id} />
          <ScheduleModal tripId={trip.id} />
          <InviteModal tripId={trip.id} open={inviteOpen} onClose={() => setInviteOpen(false)} />
        </>
      )}
    </div>
  );
}
