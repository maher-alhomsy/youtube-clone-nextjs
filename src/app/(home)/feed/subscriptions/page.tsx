import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { DEFAULT_LIMIT } from '@/constants';
import { getQueryClient, trpc } from '@/trpc/server';
import SubscriptionView from '@/modules/home/ui/views/subscription-view';

export const dynamic = 'force-dynamic';

const Page = async () => {
  const queryClient = getQueryClient();

  void queryClient.prefetchInfiniteQuery(
    trpc.videos.getManySubscribed.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SubscriptionView />
    </HydrationBoundary>
  );
};

export default Page;
