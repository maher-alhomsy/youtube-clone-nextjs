import { DEFAULT_LIMIT } from '@/constants';
import { SearchView } from '@/modules/search/ui/views/search-view';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{
    query: string | undefined;
    categoryId: string | undefined;
  }>;
}

const page = async ({ searchParams }: Props) => {
  const { categoryId, query } = await searchParams;

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.categories.getMany.queryOptions());
  void queryClient.prefetchInfiniteQuery(
    trpc.search.getMany.infiniteQueryOptions(
      { categoryId, query, limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchView query={query} categoryId={categoryId} />
    </HydrationBoundary>
  );
};

export default page;
