import {
  CornerDownRight,
  CornerDownRightIcon,
  Loader2Icon,
} from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { CommentItem } from './comment-item';
import { Button } from '@/components/ui/button';

interface Props {
  videoId: string;
  parentId: string;
}

export const CommentReplies = ({ parentId, videoId }: Props) => {
  const trpc = useTRPC();

  const { data, isLoading, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery(
      trpc.comments.getMany.infiniteQueryOptions(
        { videoId, limit: DEFAULT_LIMIT, parentId },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
      ),
    );

  return (
    <div className="pl-14">
      <div className="flex flex-col gap-4 mt-2">
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loader2Icon className="animate-spin size-6 text-muted-foreground" />
          </div>
        )}

        {!isLoading &&
          data?.pages
            .flatMap((page) => page.items)
            .map((comment) => (
              <CommentItem key={comment.id} comment={comment} variant="reply" />
            ))}
      </div>

      {hasNextPage && (
        <Button
          size="sm"
          variant="tertiary"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          <CornerDownRightIcon className="size-4" />
          Show more replies
        </Button>
      )}
    </div>
  );
};
