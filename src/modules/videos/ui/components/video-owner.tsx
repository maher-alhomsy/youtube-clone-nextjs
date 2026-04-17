import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

import { VideoGetOneOutput } from '../../types';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/user-avatar';
import { UserInfo } from '@/modules/users/ui/components/user-info';
import { useSubscription } from '@/modules/subscriptions/hooks/use-subscription';
import { SubscriptionButton } from '@/modules/subscriptions/ui/components/subscription-button';

interface Props {
  videoId: string;
  user: VideoGetOneOutput['user'];
}

export const VideoOwner = ({ user, videoId }: Props) => {
  const { userId: clerkUserId, isLoaded } = useAuth();

  const { isPending, onClick } = useSubscription({
    creatorId: user.id,
    fromVideoId: videoId,
    isSubscribed: user.viewerSubscribed,
  });

  return (
    <div className="flex items-center sm:items-start justify-between sm:justify-start gap-3 min-w-0">
      <Link prefetch href={`/users/${user.id}`}>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name} />

          <div className="flex flex-col gap-1 min-w-0">
            <UserInfo name={user.name.replace('null', ' ')} size="lg" />

            <span className="text-sm text-muted-foreground line-clamp-1">
              {user.subscriberCount} subscribers
            </span>
          </div>
        </div>
      </Link>

      {clerkUserId === user.clerkId ? (
        <Button className="rounded-full" asChild variant="secondary">
          <Link prefetch href={`/studio/videos/${videoId}`}>
            Edit Video
          </Link>
        </Button>
      ) : (
        <SubscriptionButton
          onClick={onClick}
          className="flex-none"
          disabled={isPending || !isLoaded}
          isSubscribed={user.viewerSubscribed}
        />
      )}
    </div>
  );
};
