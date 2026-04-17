'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ListIcon } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import UserAvatar from '@/components/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';

export const LoadingSkeleton = () => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton disabled>
            <Skeleton className="size-6 rounded-full shrink-0" />
            <Skeleton className="h-4 w-full" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
};

export const SubscriptionsSection = () => {
  const trpc = useTRPC();
  const pathname = usePathname();

  const { data, isLoading } = useInfiniteQuery(
    trpc.subscriptions.getMany.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Subscriptions</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {isLoading && <LoadingSkeleton />}

          {!isLoading &&
            data?.pages
              .flatMap(({ items }) => items)
              .map((subscriptions) => (
                <SidebarMenuItem
                  key={`${subscriptions.creatorId}-${subscriptions.viewerId}`}
                >
                  <SidebarMenuButton
                    asChild
                    tooltip={subscriptions.user.name}
                    isActive={pathname === `/users/${subscriptions.user.id}`}
                  >
                    <Link
                      className="flex items-center gap-4"
                      href={`/users/${subscriptions.user.id}`}
                    >
                      <UserAvatar
                        size="sm"
                        name={subscriptions.user.name}
                        imageUrl={subscriptions.user.imageUrl}
                      />
                      <span className="text-sm">
                        {subscriptions.user.name.replace('null', '')}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

          {!isLoading && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/subscriptions'}
              >
                <Link href="/subscriptions" className="flex items-center gap-4">
                  <ListIcon className="size-4" />
                  <span className="text-sm">All subscriptions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
