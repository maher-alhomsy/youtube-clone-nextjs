'use client';

import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import {
  VideoRowCard,
  VideoRowCardSkeleton,
} from '../components/video-row-card';
import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from '../components/video-grid-card';
import { InfiniteScroll } from '@/components/infinite-scroll';

interface Props {
  videoId: string;
  isManual?: boolean;
}

const SuggestionSectionSkeleton = () => {
  return (
    <>
      <div className="hidden md:block space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <VideoRowCardSkeleton key={i} size="compact" />
        ))}
      </div>

      <div className="block md:hidden space-y-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <VideoGridCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
};

const SuggestionsSectionSuspense = ({ videoId, isManual }: Props) => {
  const trpc = useTRPC();

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      trpc.suggestions.getMany.infiniteQueryOptions(
        { limit: DEFAULT_LIMIT, videoId },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
      ),
    );

  return (
    <>
      <div className="hidden md:block space-y-3">
        {data.pages
          .flatMap(({ items }) => items)
          .map((video) => (
            <VideoRowCard key={video.id} data={video} size="compact" />
          ))}
      </div>

      <div className="block md:hidden space-y-10">
        {data.pages
          .flatMap(({ items }) => items)
          .map((video) => (
            <VideoGridCard key={video.id} data={video} />
          ))}
      </div>

      <InfiniteScroll
        isManual={isManual}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  );
};

export const SuggestionsSection = (props: Props) => {
  return (
    <Suspense fallback={<SuggestionSectionSkeleton />}>
      <ErrorBoundary fallback={<div>Failed to load suggestions</div>}>
        <SuggestionsSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};
