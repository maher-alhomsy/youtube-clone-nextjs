'use client';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { VideoRowCard } from '../components/video-row-card';
import { VideoGridCard } from '../components/video-grid-card';
import { InfiniteScroll } from '@/components/infinite-scroll';

interface Props {
  videoId: string;
  isManual?: boolean;
}

export const SuggestionsSection = ({ videoId, isManual }: Props) => {
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
