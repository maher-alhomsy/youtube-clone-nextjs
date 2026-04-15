import { useMemo } from 'react';

import Image from 'next/image';
import { ListVideoIcon, PlayIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { THUMBNAIL_FALLBACK } from '@/modules/videos/constants';

interface Props {
  title: string;
  count: number;
  className?: string;
  imageUrl?: string | null;
}

export const PlaylistThumbnailSkeleton = () => {
  return (
    <div className="relative w-full overflow-hidden rounded-xl aspect-video">
      <Skeleton className="size-full" />
    </div>
  );
};

export const PlaylistThumbnail = ({
  title,
  count,
  imageUrl,
  className,
}: Props) => {
  const compactViews = useMemo(() => {
    return Intl.NumberFormat('en', { notation: 'compact' }).format(count);
  }, [count]);

  return (
    <div className={cn('relative pt-3', className)}>
      {/* Stack effect layers */}

      <div className="relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[97%] overflow-hidden rounded-xl bg-black/20 aspect-video" />
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[98.5%] overflow-hidden rounded-xl bg-black/25 aspect-video" />

        <div className="relative overflow-hidden w-full rounded-xl aspect-video">
          <Image
            fill
            alt={title}
            className="size-full object-cover"
            src={imageUrl || THUMBNAIL_FALLBACK}
          />

          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-x-2">
              <PlayIcon className="size-4 text-white fill-white" />
              <span className="font-medium text-white">Play all</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 right-2 px-1 py-1.5 rounded bg-black/80 text-white text-xs font-medium flex items-center gap-x-1">
        <ListVideoIcon className="size-4" />
        {compactViews} videos
      </div>
    </div>
  );
};
