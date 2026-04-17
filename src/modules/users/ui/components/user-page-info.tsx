import Link from 'next/link';

import { useAuth, useClerk } from '@clerk/nextjs';

import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/user-avatar';
import type { UserGetOneOutput } from '../../types';
import { useSubscription } from '@/modules/subscriptions/hooks/use-subscription';
import { SubscriptionButton } from '@/modules/subscriptions/ui/components/subscription-button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  user: UserGetOneOutput;
}

export const UserPageInfo = ({ user }: Props) => {
  const clerk = useClerk();
  const { userId, isLoaded } = useAuth();

  const { isPending, onClick } = useSubscription({
    creatorId: user.id,
    isSubscribed: user.viewerSubscribed,
  });

  const handleClick = () => {
    if (user.clerkId === userId) clerk.openUserProfile();
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:hidden">
        <div className="flex items-center gap-3">
          <UserAvatar
            size="lg"
            name={user.name}
            onClick={handleClick}
            imageUrl={user.imageUrl}
            className="size-15 cursor-pointer"
          />

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">
              {user.name.replace('null', '')}
            </h1>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>{user.subscriptionsCount} subscribers</span>
              <span>•</span>
              <span>{user.videosCount} videos</span>
            </div>
          </div>
        </div>

        {userId === user.clerkId ? (
          <Button
            asChild
            variant="secondary"
            className="w-full mt-3 rounded-full"
          >
            <Link prefetch href="/studio">
              Go to studio
            </Link>
          </Button>
        ) : (
          <SubscriptionButton
            onClick={onClick}
            className="w-full mt-3"
            disabled={isPending || !isLoaded}
            isSubscribed={user.viewerSubscribed}
          />
        )}
      </div>

      <div className="hidden  md:flex items-start gap-4">
        <UserAvatar
          size="xl"
          name={user.name}
          onClick={handleClick}
          imageUrl={user.imageUrl}
          className={cn(
            userId === user.clerkId &&
              'cursor-pointer hover:opacity-80 transition-opacity duration-300',
          )}
        />

        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-bold">
            {user.name.replace('null', '')}
          </h1>

          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
            <span>{user.subscriptionsCount} subscribers</span>
            <span>•</span>
            <span>{user.videosCount} videos</span>
          </div>

          {userId === user.clerkId ? (
            <Button asChild variant="secondary" className="mt-3 rounded-full">
              <Link prefetch href="/studio">
                Go to studio
              </Link>
            </Button>
          ) : (
            <SubscriptionButton
              onClick={onClick}
              className="mt-3"
              disabled={isPending || !isLoaded}
              isSubscribed={user.viewerSubscribed}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const UserPageInfoSkeleton = () => {
  return (
    <div className="py-6">
      <div className="flex items-center md:hidden">
        <div className="flex items-center gap-3">
          <Skeleton className="rounded-full size-15" />

          <div className="flex-1 min-w-0">
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <Skeleton className="h-10 w-full mt-3 rounded-full" />
      </div>

      <div className="hidden md:flex items-start gap-4">
        <Skeleton className="rounded-full size-40" />

        <div className="flex-1 min-w-0">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-10 w-32 mt-3 rounded-full" />
        </div>
      </div>
    </div>
  );
};
