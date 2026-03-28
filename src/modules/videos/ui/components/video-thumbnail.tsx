import Image from 'next/image';

import { formatDuration } from '@/lib/utils';
import { THUMBNAIL_FALLBACK } from '../../constants';

interface Props {
  title: string;
  duration: number;
  imageUrl?: string | null;
  previewUrl?: string | null;
}

export const VideoThumbnail = ({
  title,
  imageUrl,
  duration,
  previewUrl,
}: Props) => {
  return (
    <div className="relative group">
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        <Image
          fill
          alt={title}
          src={imageUrl ?? THUMBNAIL_FALLBACK}
          className="size-full object-cover group-hover:opacity-0"
        />

        <Image
          fill
          alt={title}
          unoptimized={!!previewUrl}
          src={previewUrl ?? THUMBNAIL_FALLBACK}
          className="size-full object-cover opacity-0 group-hover:opacity-100"
        />
      </div>

      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
        {formatDuration(duration)}
      </div>
    </div>
  );
};
