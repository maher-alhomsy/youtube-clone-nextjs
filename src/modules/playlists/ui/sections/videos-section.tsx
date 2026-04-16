'use client';

import { Suspense } from 'react';

import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClerk } from '@clerk/nextjs';
import { ErrorBoundary } from 'react-error-boundary';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from '@/modules/videos/ui/components/video-grid-card';
import { InfiniteScroll } from '@/components/infinite-scroll';
import {
  VideoRowCard,
  VideoRowCardSkeleton,
} from '@/modules/videos/ui/components/video-row-card';

interface Props {
  playlistId: string;
}

const VideosSectionSuspense = ({ playlistId }: Props) => {
  const trpc = useTRPC();
  const clerk = useClerk();
  const queryClient = useQueryClient();

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.playlists.getVideos.infiniteQueryOptions(
        { playlistId, limit: DEFAULT_LIMIT },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
      ),
    );

  const { mutate: removeVideo } = useMutation(
    trpc.playlists.removeVideo.mutationOptions({
      onSuccess: ({ playlistId, videoId }) => {
        toast.success('Video removed from the playlist');

        queryClient.invalidateQueries(
          trpc.playlists.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );

        queryClient.invalidateQueries(
          trpc.playlists.getOne.queryOptions({ playlistId }),
        );

        queryClient.invalidateQueries(
          trpc.playlists.getVideos.infiniteQueryOptions(
            { playlistId, limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );

        queryClient.invalidateQueries(
          trpc.playlists.getManyForVideo.infiniteQueryOptions(
            { videoId, limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );
      },
      onError: (error) => {
        if (error.data?.code === 'UNAUTHORIZED') {
          clerk.openSignIn();
        } else {
          toast.error(
            error.message || 'Something went wrong. Please try again.',
          );
        }
      },
    }),
  );

  return (
    <div>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {data.pages
          .flatMap(({ items }) => items)
          .map((video) => (
            <VideoGridCard
              key={video.id}
              data={video}
              onRemove={() => {
                removeVideo({ playlistId, videoId: video.id });
              }}
            />
          ))}
      </div>

      <div className="hidden flex-col gap-4 md:flex">
        {data.pages
          .flatMap(({ items }) => items)
          .map((video) => (
            <VideoRowCard
              key={video.id}
              data={video}
              size="compact"
              onRemove={() => {
                removeVideo({ playlistId, videoId: video.id });
              }}
            />
          ))}
      </div>

      <InfiniteScroll
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
};

const VideosSectionSkeleton = () => {
  return (
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <VideoGridCardSkeleton key={index} />
        ))}
      </div>

      <div className="hidden flex-col gap-4 md:flex">
        {Array.from({ length: 18 }).map((_, index) => (
          <VideoRowCardSkeleton key={index} size="compact" />
        ))}
      </div>
    </>
  );
};

export const VideosSection = ({ playlistId }: Props) => {
  return (
    <Suspense fallback={<VideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>error</p>}>
        <VideosSectionSuspense playlistId={playlistId} />
      </ErrorBoundary>
    </Suspense>
  );
};
