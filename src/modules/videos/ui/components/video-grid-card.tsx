import Link from 'next/link';

import { VideoGetManyOutput } from '../../types';
import { VideoInfo, VideoInfoSkeleton } from './video-info';
import { VideoThumbnail, VideoThumbnailSkeleton } from './video-thumbnail';

interface Props {
  onRemove?: () => void;
  data: VideoGetManyOutput['items'][number];
}

export const VideoGridCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <VideoThumbnailSkeleton />
      <VideoInfoSkeleton />
    </div>
  );
};

export const VideoGridCard = ({ data, onRemove }: Props) => {
  return (
    <div className="flex flex-col gap-2 w-full group">
      <Link prefetch href={`/videos/${data.id}`}>
        <VideoThumbnail
          title={data.title}
          duration={data.duration}
          imageUrl={data.thumbnailUrl}
          previewUrl={data.previewUrl}
        />
      </Link>

      <VideoInfo data={data} onRemove={onRemove} />
    </div>
  );
};
