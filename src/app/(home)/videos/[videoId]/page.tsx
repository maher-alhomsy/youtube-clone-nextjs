import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { getQueryClient, trpc } from '@/trpc/server';
import VideoView from '@/modules/videos/ui/views/video-view';

interface Props {
  params: Promise<{ videoId: string }>;
}

const Page = async ({ params }: Props) => {
  const { videoId } = await params;

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.videos.getOne.queryOptions({ id: videoId }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideoView videoId={videoId} />
    </HydrationBoundary>
  );
};

export default Page;
