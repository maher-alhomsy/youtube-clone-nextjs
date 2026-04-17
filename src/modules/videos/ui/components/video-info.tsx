import { useMemo } from 'react';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { VideoMenu } from './video-menu';
import { VideoGetManyOutput } from '../../types';
import UserAvatar from '@/components/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserInfo } from '@/modules/users/ui/components/user-info';

interface Props {
  data: VideoGetManyOutput['items'][number];
  onRemove?: () => void;
}

export const VideoInfoSkeleton = () => {
  return (
    <div className="flex gap-3">
      <Skeleton className="rounded-full size-10 shrink-0" />

      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-[90%]" />
        <Skeleton className="h-5 w-[70%]" />
      </div>
    </div>
  );
};

export const VideoInfo = ({ data, onRemove }: Props) => {
  const compactViews = useMemo(() => {
    return Intl.NumberFormat('en', { notation: 'compact' }).format(
      data.viewCount,
    );
  }, [data.viewCount]);

  const compactDate = useMemo(() => {
    return formatDistanceToNow(new Date(data.createdAt), { addSuffix: true });
  }, [data.createdAt]);

  return (
    <div className="flex gap-3">
      <Link prefetch href={`/users/${data.user.id}`}>
        <UserAvatar
          imageUrl={data.user.imageUrl}
          name={data.user.name.replace('null', '')}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link prefetch href={`/videos/${data.id}`}>
          <h3 className="font-medium text-base wrap-break-word line-clamp-1 lg:line-clamp-2">
            {data.title}
          </h3>
        </Link>

        <Link prefetch href={`/users/${data.user.id}`}>
          <UserInfo name={data.user.name.replace('null', '')} />
        </Link>

        <Link prefetch href={`/videos/${data.id}`}>
          <p className="text-sm text-gray-600 line-clamp-1">
            {compactViews} views • {compactDate}
          </p>
        </Link>
      </div>

      <div className="shrink-0">
        <VideoMenu videoId={data.id} onRemove={onRemove} />
      </div>
    </div>
  );
};
