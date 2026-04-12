import { useMemo } from 'react';

import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { VideoMenu } from './video-menu';
import UserAvatar from '@/components/user-avatar';
import { VideoThumbnail } from './video-thumbnail';
import { Skeleton } from '@/components/ui/skeleton';
import type { VideoGetManyOutput } from '../../types';
import { UserInfo } from '@/modules/users/ui/components/user-info';

const videoRowCardVariants = cva('group flex min-w-0', {
  variants: {
    size: { default: 'gap-4', compact: 'gap-2' },
  },
  defaultVariants: { size: 'default' },
});

const thumbnailVariants = cva('relative flex-none', {
  variants: {
    size: { default: 'w-[38%]', compact: 'w-[168px]' },
  },
  defaultVariants: { size: 'default' },
});

interface Props extends VariantProps<typeof videoRowCardVariants> {
  data: VideoGetManyOutput['items'][number];
  onRemove?: () => void;
}

export const VideoRowCardSkeleton = () => {
  return (
    <div>
      <Skeleton />
    </div>
  );
};

export const VideoRowCard = ({ data, onRemove, size }: Props) => {
  const compactViews = useMemo(() => {
    return Intl.NumberFormat('en', { notation: 'compact' }).format(
      data.viewCount,
    );
  }, [data.viewCount]);

  const compactLikes = useMemo(() => {
    return Intl.NumberFormat('en', { notation: 'compact' }).format(
      data.likeCount,
    );
  }, [data.likeCount]);

  return (
    <div className={videoRowCardVariants({ size })}>
      <Link href={`/videos/${data.id}`} className={thumbnailVariants({ size })}>
        <VideoThumbnail
          title={data.title}
          duration={data.duration}
          imageUrl={data.thumbnailUrl}
          previewUrl={data.previewUrl}
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-x-2">
          <Link href={`/videos/${data.id}`} className="flex-1 min-w-0">
            <h3
              className={cn(
                'font-medium line-clamp-2',
                size === 'compact' ? 'text-sm' : 'text-base',
              )}
            >
              {data.title}
            </h3>

            {size === 'default' && (
              <p className="text-xs text-muted-foreground mt-1">
                {compactViews} views • {compactLikes} likes
              </p>
            )}

            {size === 'default' && (
              <>
                <div className="flex items-center gap-2 my-3">
                  <UserAvatar
                    size="sm"
                    name={data.user.name}
                    imageUrl={data.user.imageUrl}
                  />

                  <UserInfo name={data.user.name} size="sm" />
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground w-fit line-clamp-2">
                      {data.description || 'No Description'}{' '}
                    </p>
                  </TooltipTrigger>

                  <TooltipContent
                    side="bottom"
                    align="center"
                    className="bg-black/70"
                  >
                    <p>From the video description</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {size === 'compact' && (
              <UserInfo size="sm" name={data.user.name.replace('null', '')} />
            )}

            {size === 'compact' && (
              <p className="text-xs text-muted-foreground mt-1">
                {compactViews} views • {compactLikes} likes
              </p>
            )}
          </Link>

          <div className="flex-none">
            <VideoMenu videoId={data.id} onRemove={onRemove} />
          </div>
        </div>
      </div>
    </div>
  );
};
