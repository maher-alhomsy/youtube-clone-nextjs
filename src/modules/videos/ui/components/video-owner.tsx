import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

import { VideoGetOneOutput } from '../../types';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/user-avatar';
import { UserInfo } from '@/modules/users/ui/components/user-info';
import { SubscriptionButton } from '@/modules/subscriptions/ui/components/subscription-button';

interface Props {
  videoId: string;
  user: VideoGetOneOutput['user'];
}

export const VideoOwner = ({ user, videoId }: Props) => {
  const { userId: clerkUserId } = useAuth();

  return (
    <div className="flex items-center sm:items-start justify-between sm:justify-start gap-3 min-w-0">
      <Link href={`/users/${user.id}`}>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name} />

          <div className="flex flex-col gap-1 min-w-0">
            <UserInfo name={user.name.replace('null', ' ')} size="lg" />

            <span className="text-sm text-muted-foreground line-clamp-1">
              {0} subscribers
            </span>
          </div>
        </div>
      </Link>

      {clerkUserId === user.clerkId ? (
        <Button className="rounded-full" asChild variant="secondary">
          <Link href={`/studio/videos/${videoId}`}>Edit Video</Link>
        </Button>
      ) : (
        <SubscriptionButton
          disabled={false}
          onClick={() => {}}
          isSubscribed={false}
          className="flex-none"
        />
      )}
    </div>
  );
};
