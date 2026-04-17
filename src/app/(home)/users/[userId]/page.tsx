import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { DEFAULT_LIMIT } from '@/constants';
import { getQueryClient, trpc } from '@/trpc/server';
import { UserView } from '@/modules/users/ui/views/user-view';

interface Props {
  params: Promise<{ userId: string }>;
}

const Page = async ({ params }: Props) => {
  const { userId } = await params;

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.users.getOne.queryOptions({ userId }));
  void queryClient.prefetchInfiniteQuery(
    trpc.videos.getMany.infiniteQueryOptions(
      { userId, limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserView userId={userId} />
    </HydrationBoundary>
  );
};

export default Page;
