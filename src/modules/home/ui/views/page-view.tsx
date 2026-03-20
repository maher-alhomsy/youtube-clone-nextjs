'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';

const PageView = () => {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(trpc.home.getHome.queryOptions());

  return <div>PageView {data.message}</div>;
};

export default PageView;
