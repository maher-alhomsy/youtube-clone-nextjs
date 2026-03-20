import { Suspense } from 'react';

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import PageView from '@/modules/home/ui/views/page-view';
import { getQueryClient, trpc } from '@/trpc/server';

export default async function Home() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.home.getHome.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<p>Loading...</p>}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <div>I will load videos in the future!</div>

          <PageView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}
