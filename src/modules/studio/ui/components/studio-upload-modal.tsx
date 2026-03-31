'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { Button } from '@/components/ui/button';
import { StudioUploader } from './studio-uploader';
import { ResponsiveModal } from '@/components/responsive-modal';

const StudioUploadModal = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending, data, reset } = useMutation(
    trpc.videos.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.studio.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastpage) => lastpage.nextCursor },
          ),
        );

        toast.success('Video created');
      },

      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSuccess = () => {
    if (!data?.video.id) return;

    reset();
    router.push(`/studio/videos/${data.video.id}`);
  };

  return (
    <>
      <ResponsiveModal
        open={!!data?.url}
        title="Upload a video"
        onOpenChange={() => reset()}
      >
        {data?.url ? (
          <StudioUploader onSuccess={onSuccess} endpoint={data.url} />
        ) : (
          <Loader2Icon />
        )}
      </ResponsiveModal>

      <Button variant="secondary" disabled={isPending} onClick={() => mutate()}>
        {isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
        Create
      </Button>
    </>
  );
};

export default StudioUploadModal;
