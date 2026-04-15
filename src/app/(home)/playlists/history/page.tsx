import { DEFAULT_LIMIT } from '@/constants';
import { HistoryView } from '@/modules/playlists/ui/views/history-view';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

const Page = async () => {
  const queryClient = getQueryClient();

  void queryClient.prefetchInfiniteQuery(
    trpc.playlists.getHistory.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HistoryView />
    </HydrationBoundary>
  );
};

export default Page;
