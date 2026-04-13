'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { InfiniteScroll } from '@/components/infinite-scroll';
import { VideoRowCard } from '@/modules/videos/ui/components/video-row-card';
import { VideoGridCard } from '@/modules/videos/ui/components/video-grid-card';

interface Props {
  query: string | undefined;
  categoryId: string | undefined;
}

export const ResultsSection = ({ query, categoryId }: Props) => {
  const trpc = useTRPC();
  const isMobile = useIsMobile();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.search.getMany.infiniteQueryOptions(
        { query, categoryId, limit: DEFAULT_LIMIT },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
      ),
    );

  return (
    <>
      {isMobile ? (
        <div className="flex flex-col gap-4 gap-y-10">
          {data.pages
            .flatMap((page) => page.items)
            .map((video) => (
              <VideoGridCard key={video.id} data={video} />
            ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.pages
            .flatMap((page) => page.items)
            .map((video) => (
              <VideoRowCard key={video.id} data={video} />
            ))}
        </div>
      )}

      <InfiniteScroll
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  );
};
