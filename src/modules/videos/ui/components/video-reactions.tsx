import { toast } from 'sonner';
import { useClerk } from '@clerk/nextjs';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { useTRPC } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { type VideoGetOneOutput } from '../../types';
import { Separator } from '@/components/ui/separator';
import { DEFAULT_LIMIT } from '@/constants';

interface Props {
  likes: number;
  videoId: string;
  dislikes: number;
  viewerReaction: VideoGetOneOutput['viewerReaction'];
}

export const VideoReactions = ({
  likes,
  videoId,
  dislikes,
  viewerReaction,
}: Props) => {
  const trpc = useTRPC();
  const clerk = useClerk();
  const queryClient = useQueryClient();

  const { mutate: likeMutation, isPending: isLikePending } = useMutation(
    trpc.videoReactions.like.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.videos.getOne.queryOptions({ id: videoId }),
        );
      },

      onError: (error) => {
        toast.error(error.message);

        if (error.data?.code === 'UNAUTHORIZED') {
          clerk.openSignIn();
        }
      },
    }),
  );

  const { mutate: dislikeMutation, isPending: isDislikePending } = useMutation(
    trpc.videoReactions.dislike.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.videos.getOne.queryOptions({ id: videoId }),
        );

        queryClient.invalidateQueries(
          trpc.playlists.getLiked.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (page) => page.nextCursor },
          ),
        );
      },
      onError: (error) => {
        toast.error(error.message);

        if (error.data?.code === 'UNAUTHORIZED') {
          clerk.openSignIn();
        }
      },
    }),
  );

  const handleLike = () => {
    likeMutation({ videoId });
  };

  const handleDislike = () => {
    dislikeMutation({ videoId });
  };

  return (
    <div className="flex items-center flex-none">
      <Button
        onClick={handleLike}
        variant="secondary"
        disabled={isLikePending || isDislikePending}
        className="rounded-l-full rounded-r-none gap-2 pr-4 cursor-pointer"
      >
        <ThumbsUpIcon
          className={cn('size-5', viewerReaction === 'like' && 'fill-black')}
        />
        {likes}
      </Button>

      <Separator orientation="vertical" className="h-7" />

      <Button
        variant="secondary"
        onClick={handleDislike}
        disabled={isLikePending || isDislikePending}
        className="rounded-l-none rounded-r-full pl-3 cursor-pointer"
      >
        <ThumbsDownIcon
          className={cn('size-5', viewerReaction === 'dislike' && 'fill-black')}
        />
        {dislikes}
      </Button>
    </div>
  );
};
