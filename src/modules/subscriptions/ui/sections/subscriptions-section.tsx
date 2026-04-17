'use client';

import { Suspense } from 'react';

import Link from 'next/link';

import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';

import {
  SubscriptionItem,
  SubscriptionItemSkeleton,
} from '../components/subscription-item';
import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { InfiniteScroll } from '@/components/infinite-scroll';

const SubscriptionsSectionSuspense = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.subscriptions.getMany.infiniteQueryOptions(
        { limit: DEFAULT_LIMIT },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
      ),
    );

  const { mutate, isPending } = useMutation(
    trpc.subscriptions.remove.mutationOptions({
      onSuccess: ({ creatorId }) => {
        toast.success('Unsubscribed!');

        queryClient.invalidateQueries(
          trpc.videos.getManySubscribed.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );

        queryClient.invalidateQueries(
          trpc.subscriptions.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (page) => page.nextCursor },
          ),
        );

        queryClient.invalidateQueries(
          trpc.users.getOne.queryOptions({ userId: creatorId }),
        );
      },

      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const handleUnsubscribe = (creatorId: string) => {
    mutate({ creatorId });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {data.pages
          .flatMap(({ items }) => items)
          .map((subscription) => (
            <Link
              prefetch
              key={subscription.creatorId}
              href={`/users/${subscription.user.id}`}
            >
              <SubscriptionItem
                disabled={isPending}
                name={subscription.user.name}
                imageUrl={subscription.user.imageUrl}
                subscriberCount={subscription.user.subscriberCount}
                onUnsubscribe={() => handleUnsubscribe(subscription.creatorId)}
              />
            </Link>
          ))}
      </div>

      <InfiniteScroll
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  );
};

const SubscriptionsSectionSkeleton = () => {
  return (
    <>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SubscriptionItemSkeleton key={index} />
        ))}
      </div>
    </>
  );
};

export const SubscriptionsSection = () => {
  return (
    <Suspense fallback={<SubscriptionsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>error</p>}>
        <SubscriptionsSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};
