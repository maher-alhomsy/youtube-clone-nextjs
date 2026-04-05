import { inferRouterOutputs } from '@trpc/server';

import { AppRouter } from '@/trpc/routers/_app';

export type Comment =
  inferRouterOutputs<AppRouter>['comments']['getMany']['items'][number];
