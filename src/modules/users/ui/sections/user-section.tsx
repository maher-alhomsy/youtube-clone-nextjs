'use client';

import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';
import { useSuspenseQuery } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import {
  UserPageInfo,
  UserPageInfoSkeleton,
} from '../components/user-page-info';
import {
  UserPageBanner,
  UserPageBannerSkeleton,
} from '../components/user-page-banner';
import { Separator } from '@/components/ui/separator';

interface Props {
  userId: string;
}

const UserSectionSkeleton = () => {
  return (
    <div className="flex flex-col ">
      <UserPageBannerSkeleton />
      <UserPageInfoSkeleton />
      <Separator />
    </div>
  );
};

export const UserSection = ({ userId }: Props) => {
  return (
    <Suspense fallback={<UserSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Failed to load user section.</p>}>
        <UserSectionSuspense userId={userId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const UserSectionSuspense = ({ userId }: Props) => {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(trpc.users.getOne.queryOptions({ userId }));

  return (
    <div className="flex flex-col">
      <UserPageBanner user={data} />
      <UserPageInfo user={data} />
      <Separator />
    </div>
  );
};
