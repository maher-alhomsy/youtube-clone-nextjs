import { toast } from 'sonner';
import { useClerk } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';

interface Props {
  creatorId: string;
  isSubscribed: boolean;
  fromVideoId?: string;
}

export const useSubscription = ({
  creatorId,
  fromVideoId,
  isSubscribed,
}: Props) => {
  const trpc = useTRPC();
  const clerk = useClerk();
  const queryClient = useQueryClient();

  const subscribe = useMutation(
    trpc.subscriptions.create.mutationOptions({
      onSuccess: () => {
        toast.success('Subscribed!');

        queryClient.invalidateQueries(
          trpc.videos.getManySubscribed.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );

        queryClient.invalidateQueries(
          trpc.users.getOne.queryOptions({ userId: creatorId }),
        );

        if (fromVideoId) {
          queryClient.invalidateQueries(
            trpc.videos.getOne.queryOptions({ id: fromVideoId }),
          );
        }
      },

      onError: (err) => {
        toast.error(err.message);

        if (err.data?.code === 'UNAUTHORIZED') {
          clerk.openSignIn();
        }
      },
    }),
  );

  const unsubscribe = useMutation(
    trpc.subscriptions.remove.mutationOptions({
      onSuccess: () => {
        toast.success('Unsubscribed!');

        queryClient.invalidateQueries(
          trpc.videos.getManySubscribed.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );

        queryClient.invalidateQueries(
          trpc.users.getOne.queryOptions({ userId: creatorId }),
        );

        if (fromVideoId) {
          queryClient.invalidateQueries(
            trpc.videos.getOne.queryOptions({ id: fromVideoId }),
          );
        }
      },

      onError: (err) => {
        toast.error(err.message);

        if (err.data?.code === 'UNAUTHORIZED') {
          clerk.openSignIn();
        }
      },
    }),
  );

  const isPending = subscribe.isPending || unsubscribe.isPending;

  const onClick = () => {
    if (isSubscribed) {
      unsubscribe.mutate({ creatorId });
    } else {
      subscribe.mutate({ creatorId });
    }
  };

  return { isPending, onClick };
};
