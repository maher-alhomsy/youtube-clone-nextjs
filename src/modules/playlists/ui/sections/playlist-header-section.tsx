'use client';

import { Suspense } from 'react';

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from 'react-error-boundary';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  playlistId: string;
}

const PlaylistHeaderSectionSuspense = ({ playlistId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(
    trpc.playlists.getOne.queryOptions({ playlistId }),
  );

  const { mutate, isPending } = useMutation(
    trpc.playlists.remove.mutationOptions({
      onSuccess: () => {
        toast.success('Playlist removed');

        queryClient.invalidateQueries(
          trpc.playlists.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );

        router.push('/playlists');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleRemove = () => {
    mutate({ playlistId });
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <p className="text-xs text-muted-foreground">
          Videos from the playlist
        </p>
      </div>

      <Button
        size="icon"
        variant="outline"
        disabled={isPending}
        onClick={handleRemove}
        className="rounded-full cursor-pointer"
      >
        <Trash2Icon />
      </Button>
    </div>
  );
};

const PlaylistHeaderSectionSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-2">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
};

export const PlaylistHeaderSection = ({ playlistId }: Props) => {
  return (
    <Suspense fallback={<PlaylistHeaderSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <PlaylistHeaderSectionSuspense playlistId={playlistId} />
      </ErrorBoundary>
    </Suspense>
  );
};
