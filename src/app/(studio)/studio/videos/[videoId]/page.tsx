import { VideoView } from '@/modules/studio/ui/views/video-view';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

interface Props {
  params: Promise<{ videoId: string }>;
}

export const dynamic = 'force-dynamic';

const Page = async ({ params }: Props) => {
  const { videoId } = await params;

  const client = getQueryClient();

  void client.prefetchQuery(trpc.categories.getMany.queryOptions());
  void client.prefetchQuery(trpc.studio.getOne.queryOptions({ id: videoId }));

  return (
    <HydrationBoundary state={dehydrate(client)}>
      <VideoView videoId={videoId} />
    </HydrationBoundary>
  );
};

export default Page;
