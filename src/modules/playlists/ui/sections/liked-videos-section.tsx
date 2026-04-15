'use client';

import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from '@/modules/videos/ui/components/video-grid-card';
import { InfiniteScroll } from '@/components/infinite-scroll';
import {
  VideoRowCard,
  VideoRowCardSkeleton,
} from '@/modules/videos/ui/components/video-row-card';

const LikedVideosSectionSuspense = () => {
  const trpc = useTRPC();

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.playlists.getLiked.infiniteQueryOptions(
        { limit: DEFAULT_LIMIT },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
      ),
    );

  return (
    <div>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {data.pages
          .flatMap(({ items }) => items)
          .map((video) => (
            <VideoGridCard key={video.id} data={video} />
          ))}
      </div>

      <div className="hidden flex-col gap-4 md:flex">
        {data.pages
          .flatMap(({ items }) => items)
          .map((video) => (
            <VideoRowCard key={video.id} data={video} size="compact" />
          ))}
      </div>

      <InfiniteScroll
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
};

const LikedVideosSectionSkeleton = () => {
  return (
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <VideoGridCardSkeleton key={index} />
        ))}
      </div>

      <div className="hidden flex-col gap-4 md:flex">
        {Array.from({ length: 18 }).map((_, index) => (
          <VideoRowCardSkeleton key={index} size="compact" />
        ))}
      </div>
    </>
  );
};

export const LikedVideosSection = () => {
  return (
    <Suspense fallback={<LikedVideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>error</p>}>
        <LikedVideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};
