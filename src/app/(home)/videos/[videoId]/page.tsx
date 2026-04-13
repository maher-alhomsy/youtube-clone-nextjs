import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { DEFAULT_LIMIT } from '@/constants';
import { getQueryClient, trpc } from '@/trpc/server';
import VideoView from '@/modules/videos/ui/views/video-view';

interface Props {
  params: Promise<{ videoId: string }>;
}

export const dynamic = 'force-dynamic';

const Page = async ({ params }: Props) => {
  const { videoId } = await params;

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.videos.getOne.queryOptions({ id: videoId }),
  );

  void queryClient.prefetchInfiniteQuery(
    trpc.comments.getMany.infiniteQueryOptions(
      { videoId, limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  void queryClient.prefetchInfiniteQuery(
    trpc.suggestions.getMany.infiniteQueryOptions(
      { videoId, limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideoView videoId={videoId} />
    </HydrationBoundary>
  );
};

export default Page;
