import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { DEFAULT_LIMIT } from '@/constants';
import { getQueryClient, trpc } from '@/trpc/server';
import { PlaylistsView } from '@/modules/playlists/ui/views/playlists-view';

const Page = async () => {
  const queryClient = getQueryClient();

  void queryClient.prefetchInfiniteQuery(
    trpc.playlists.getMany.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlaylistsView />
    </HydrationBoundary>
  );
};

export default Page;
