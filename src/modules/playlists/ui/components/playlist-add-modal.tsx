'use client';

import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClerk } from '@clerk/nextjs';
import { Loader2Icon, SquareCheckIcon, SquareIcon } from 'lucide-react';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { Button } from '@/components/ui/button';
import { InfiniteScroll } from '@/components/infinite-scroll';
import { ResponsiveModal } from '@/components/responsive-modal';

interface Props {
  open: boolean;
  videoId: string;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistAddModal = ({ open, onOpenChange, videoId }: Props) => {
  const trpc = useTRPC();
  const clerk = useClerk();
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useInfiniteQuery(
      trpc.playlists.getManyForVideo.infiniteQueryOptions(
        { limit: DEFAULT_LIMIT, videoId },
        {
          enabled: !!videoId && open,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        },
      ),
    );

  const { mutate: addVideo, isPending: isAddingVideo } = useMutation(
    trpc.playlists.addVideo.mutationOptions({
      onSuccess: () => {
        toast.success('Video added to the playlist');

        queryClient.invalidateQueries(
          trpc.playlists.getManyForVideo.infiniteQueryOptions(
            { videoId, limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );

        queryClient.invalidateQueries(
          trpc.playlists.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
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

  const { mutate: removeVideo, isPending: isRemovingVideo } = useMutation(
    trpc.playlists.removeVideo.mutationOptions({
      onSuccess: () => {
        toast.success('Video removed from the playlist');

        queryClient.invalidateQueries(
          trpc.playlists.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
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

  const handleClick = (playlistId: string, containsVideo: boolean) => {
    if (containsVideo) {
      removeVideo({ playlistId, videoId });
    } else {
      console.log({ playlistId, videoId, containsVideo });

      addVideo({ playlistId, videoId });
    }
  };

  return (
    <ResponsiveModal
      open={open}
      title="Add to Playlist"
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2Icon className="animate-spin size-5 text-muted-foreground" />
          </div>
        )}

        {!isLoading &&
          data?.pages
            .flatMap(({ items }) => items)
            .map((playlist) => (
              <Button
                size="lg"
                variant="ghost"
                key={playlist.id}
                disabled={isAddingVideo || isRemovingVideo}
                className="w-full justify-start px-2 [&_svg]:size-5 cursor-pointer"
                onClick={() => handleClick(playlist.id, playlist.containsVideo)}
              >
                {playlist.containsVideo ? (
                  <SquareCheckIcon className="mr-2" />
                ) : (
                  <SquareIcon className="mr-2" />
                )}

                {playlist.name}
              </Button>
            ))}

        {!isLoading && (
          <InfiniteScroll
            isManual
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        )}
      </div>
    </ResponsiveModal>
  );
};
