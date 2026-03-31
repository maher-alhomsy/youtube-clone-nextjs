import { useMemo } from 'react';

import { format, formatDistanceToNow } from 'date-fns';

import { VideoMenu } from './video-menu';
import { VideoOwner } from './video-owner';
import { VideoGetOneOutput } from '../../types';
import { VideoReactions } from './video-reactions';
import { VideoDescription } from './video-description';

interface Props {
  video: VideoGetOneOutput;
}

export const VideoTopRow = ({ video }: Props) => {
  const compactViews = useMemo(() => {
    return Intl.NumberFormat('en', {
      notation: 'compact',
    }).format(1000);
  }, []);

  const expandedViews = useMemo(() => {
    return Intl.NumberFormat('en', {
      notation: 'standard',
    }).format(1000);
  }, []);

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
          <VideoReactions />
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
