import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import type { Member } from '@/types';

interface MemberAvatarProps {
  member: Member;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

const ROLE_LABELS: Record<string, string> = {
  owner: '擁有者',
  editor: '編輯者',
  viewer: '檢視者',
};

export function MemberAvatar({ member, size = 'md', showBadge = false, className }: MemberAvatarProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <Avatar
        className={cn(sizeMap[size], 'ring-2 ring-background')}
        style={{ '--avatar-color': member.user.color } as React.CSSProperties}
      >
        <AvatarFallback
          className="text-white font-semibold"
          style={{ backgroundColor: member.user.color }}
        >
          {member.user.initials}
        </AvatarFallback>
      </Avatar>
      {showBadge && (
        <Badge
          variant={member.role === 'owner' ? 'default' : 'secondary'}
          className="text-[10px] px-1.5 py-0"
        >
          {ROLE_LABELS[member.role]}
        </Badge>
      )}
    </div>
  );
}

interface MemberStackProps {
  members: Member[];
  max?: number;
  size?: 'sm' | 'md';
}

export function MemberStack({ members, max = 4, size = 'sm' }: MemberStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((member) => (
        <Avatar
          key={member.id}
          className={cn(sizeMap[size], 'ring-2 ring-background')}
          title={member.user.name}
        >
          <AvatarFallback
            className="text-white font-semibold"
            style={{ backgroundColor: member.user.color }}
          >
            {member.user.initials}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            sizeMap[size],
            'rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-muted-foreground font-semibold',
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
