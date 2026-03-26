'use client';

import { toast } from 'sonner';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/responsive-modal';
import { StudioUploader } from './studio-uploader';

const StudioUploadModal = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate, isPending, data, reset } = useMutation(
    trpc.vidoes.create.mutationOptions({
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

  return (
    <>
      <ResponsiveModal
        open={!!data?.url}
        title="Upload a video"
        onOpenChange={() => reset()}
      >
        {data?.url ? (
          <StudioUploader onSuccess={() => {}} endpoint={data.url} />
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
