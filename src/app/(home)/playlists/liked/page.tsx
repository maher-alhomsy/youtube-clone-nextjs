import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { DEFAULT_LIMIT } from '@/constants';
import { getQueryClient, trpc } from '@/trpc/server';
import { LikedView } from '@/modules/playlists/ui/views/liked-view';

const Page = () => {
  const queryClient = getQueryClient();

  void queryClient.prefetchInfiniteQuery(
    trpc.playlists.getLiked.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LikedView />
    </HydrationBoundary>
  );
};

export default Page;
