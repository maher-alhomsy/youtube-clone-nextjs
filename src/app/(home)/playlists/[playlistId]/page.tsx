import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { DEFAULT_LIMIT } from '@/constants';
import { getQueryClient, trpc } from '@/trpc/server';
import { VideosView } from '@/modules/playlists/ui/views/videos-view';

interface Props {
  params: Promise<{ playlistId: string }>;
}

export const dynamic = 'force-dynamic';

const Page = async ({ params }: Props) => {
  const { playlistId } = await params;

  const queryClient = getQueryClient();

  void queryClient.prefetchInfiniteQuery(
    trpc.playlists.getVideos.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT, playlistId },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  void queryClient.prefetchQuery(
    trpc.playlists.getOne.queryOptions({ playlistId }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideosView playlistId={playlistId} />
    </HydrationBoundary>
  );
};

export default Page;
