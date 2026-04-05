import { useMemo } from 'react';

import { format, formatDistanceToNow } from 'date-fns';

import { VideoMenu } from './video-menu';
import { VideoOwner } from './video-owner';
import { VideoGetOneOutput } from '../../types';
import { VideoReactions } from './video-reactions';
import { VideoDescription } from './video-description';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  video: VideoGetOneOutput;
}

export const VideoTopRow = ({ video }: Props) => {
  const compactViews = useMemo(() => {
    return Intl.NumberFormat('en', {
      notation: 'compact',
    }).format(video.viewCount);
  }, [video.viewCount]);

  const expandedViews = useMemo(() => {
    return Intl.NumberFormat('en', {
      notation: 'standard',
    }).format(video.viewCount);
  }, [video.viewCount]);

  const compactDate = useMemo(() => {
    return formatDistanceToNow(new Date(video.createdAt), {
      addSuffix: true,
    });
  }, [video.createdAt]);

  const expandedDate = useMemo(() => {
    return format(new Date(video.createdAt), 'd MMMM yyyy');
  }, [video.createdAt]);

  return (
    <div className="flex flex-col gap-4 mt-4">
      <h1 className="text-xl font-semibold">{video.title}</h1>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <VideoOwner videoId={video.id} user={video.user} />

        <div className="flex overflow-x-auto sm:min-w-[calc(50% - 6px)] sm:justify-end sm:overflow-visible pb-2 -mb-2 sm:pb-0 sm:mb-0 gap-2">
          <VideoReactions
            videoId={video.id}
            likes={video.likeCount}
            dislikes={video.dislikeCount}
            viewerReaction={video.viewerReaction}
          />
          <VideoMenu videoId={video.id} variant="secondary" />
        </div>
      </div>

      <VideoDescription
        compactDate={compactDate}
        expandedDate={expandedDate}
        compactViews={compactViews}
        expandedViews={expandedViews}
        description={video.description}
      />
    </div>
  );
};

export const VideoTopRowSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="w-4/5 h-6 md:w-2/5" />
      </div>

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 w-[70%]">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />

          <div className="flex flex-col w-full gap-y-2">
            <Skeleton className="w-4/5 h-5 md:w-2/6" />
            <Skeleton className="w-3/5 h-5 md:w-11/5 " />
          </div>
        </div>

        <Skeleton className="w-2/6 h-9 md:w-1/6 rounded-full" />
      </div>

      <div className="h-30 w-full" />
    </div>
  );
};
