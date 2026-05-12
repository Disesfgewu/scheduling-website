'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users } from 'lucide-react';
import { MemberStack } from './MemberAvatar';
import { formatDateRange } from '@/lib/utils';
import type { Trip } from '@/types';

// Gradient palettes by emoji/index when no cover image
const GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-rose-400 to-orange-500',
  'from-cyan-500 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-fuchsia-500 to-pink-600',
];

interface TripCardProps {
  trip: Trip;
  index?: number;
}

export function TripCard({ trip, index = 0 }: TripCardProps) {
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link href={`/trips/${trip.id}`} className="block group">
        <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
          {/* Cover */}
          <div className="relative h-52 overflow-hidden">
            {trip.coverImage ? (
              <Image
                src={trip.coverImage}
                alt={trip.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized={trip.coverImage.startsWith('data:')}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center transition-transform duration-500 group-hover:scale-105`}>
                <span className="text-6xl drop-shadow-lg">{trip.emoji}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Top: emoji badge */}
            {trip.coverImage && (
              <div className="absolute top-3 left-3">
                <span className="text-2xl drop-shadow">{trip.emoji}</span>
              </div>
            )}

            {/* Top right: member avatars */}
            <div className="absolute top-3 right-3">
              <MemberStack members={trip.members} max={3} size="sm" />
            </div>

            {/* Bottom: title */}
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
                {trip.title}
              </h3>
            </div>
          </div>

          {/* Card body */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{trip.location}{trip.country ? `, ${trip.country}` : ''}</span>
              </div>
              {trip.members.length > 0 && (
                <>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>{trip.members.length} 人</span>
                  </div>
                </>
              )}
            </div>

            {trip.startDate && trip.endDate && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
              </div>
            )}

            {trip.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {trip.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {trip.events.length} 個行程項目
              </span>
              <span className="text-xs font-medium text-primary group-hover:underline">
                查看行程 →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
