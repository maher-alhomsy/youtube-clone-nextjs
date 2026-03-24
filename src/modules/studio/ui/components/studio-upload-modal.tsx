'use client';

import { toast } from 'sonner';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { Button } from '@/components/ui/button';

const StudioUploadModal = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
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
    <Button variant="secondary" disabled={isPending} onClick={() => mutate()}>
      {isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
      Create
    </Button>
  );
};

export default StudioUploadModal;
