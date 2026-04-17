import { useState } from 'react';

import {
  Trash2Icon,
  ThumbsUpIcon,
  ChevronUpIcon,
  ThumbsDownIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
  MessageSquareIcon,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Comment } from '../../types';
import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { CommentForm } from './comment-form';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/user-avatar';
import { CommentReplies } from './comment-replies';

interface Props {
  comment: Comment;
  variant?: 'comment' | 'reply';
}

export const CommentItem = ({ comment, variant = 'comment' }: Props) => {
  const trpc = useTRPC();
  const clerk = useClerk();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);

  const { mutate, isPending } = useMutation(
    trpc.comments.remove.mutationOptions(),
  );

  const onDelete = () => {
    mutate(
      { id: comment.id },
      {
        onSuccess: () => {
          toast.success('Comment deleted successfully');
          queryClient.invalidateQueries(
            trpc.comments.getMany.infiniteQueryOptions(
              { videoId: comment.videoId, limit: DEFAULT_LIMIT },
              { getNextPageParam: (lastPage) => lastPage.nextCursor },
            ),
          );
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to delete comment');

          if (error.data?.code === 'UNAUTHORIZED') {
            clerk.openSignIn();
          }
        },
      },
    );
  };

  const { mutate: likeMutation, isPending: isLikePending } = useMutation(
    trpc.commentReactions.like.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.comments.getMany.infiniteQueryOptions(
            { videoId: comment.videoId, limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );
      },

      onError: (error) => {
        toast.error(error.message || 'Failed to react to comment');

        if (error.data?.code === 'UNAUTHORIZED') {
          clerk.openSignIn();
        }
      },
    }),
  );

  const { mutate: dislikeMutation, isPending: isDislikePending } = useMutation(
    trpc.commentReactions.dislike.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.comments.getMany.infiniteQueryOptions(
            { videoId: comment.videoId, limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );
      },

      onError: (error) => {
        toast.error(error.message || 'Failed to react to comment');

        if (error.data?.code === 'UNAUTHORIZED') {
          clerk.openSignIn();
        }
      },
    }),
  );

  const onSuccessReply = () => {
    setIsReplyOpen(false);
    setIsRepliesOpen(true);
  };

  const onCancelReply = () => {
    setIsReplyOpen(false);
  };

  const onViewReplies = () => {
    setIsRepliesOpen((prev) => !prev);
  };

  return (
    <>
      <div className="flex gap-4">
        <Link prefetch href={`/users/${comment.userId}`}>
          <UserAvatar
            name={comment.user.name}
            imageUrl={comment.user.imageUrl}
            size={variant === 'comment' ? 'lg' : 'sm'}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link prefetch href={`/users/${comment.userId}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm pb-0.5">
                {comment.user.name.replace(/null/g, '')}
              </span>

              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </span>
            </div>
          </Link>

          <p className="text-sm">{comment.value}</p>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              <Button
                size="icon"
                variant="ghost"
                className="size-8 cursor-pointer"
                disabled={isLikePending || isDislikePending}
                onClick={() => likeMutation({ commentId: comment.id })}
              >
                <ThumbsUpIcon
                  className={cn(
                    comment.viewerReaction === 'like' ? 'fill-black' : '',
                  )}
                />
              </Button>

              <span className="text-xs text-muted-foreground">
                {comment.likeCount}
              </span>

              <Button
                size="icon"
                variant="ghost"
                className="size-8 cursor-pointer"
                disabled={isLikePending || isDislikePending}
                onClick={() => dislikeMutation({ commentId: comment.id })}
              >
                <ThumbsDownIcon
                  className={cn(
                    comment.viewerReaction === 'dislike' ? 'fill-black ' : '',
                  )}
                />
              </Button>

              <span className="text-xs text-muted-foreground">
                {comment.dislikeCount}
              </span>
            </div>

            {variant === 'comment' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 cursor-pointer"
                onClick={() => setIsReplyOpen(true)}
              >
                Reply
              </Button>
            )}
          </div>
        </div>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild disabled={isPending}>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 cursor-pointer"
            >
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {variant === 'comment' && (
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => setIsReplyOpen(true)}
              >
                <MessageSquareIcon className="size-4" />
                Reply
              </DropdownMenuItem>
            )}

            {comment.user.clerkId === userId && (
              <DropdownMenuItem disabled={isPending} onClick={onDelete}>
                <Trash2Icon className="size-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isReplyOpen && variant === 'comment' && (
        <div className="mt-4 pl-14">
          <CommentForm
            variant="reply"
            parentId={comment.id}
            onCancel={onCancelReply}
            videoId={comment.videoId}
            onSuccess={onSuccessReply}
          />
        </div>
      )}

      {comment.replyCount > 0 && variant === 'comment' && (
        <div className="pl-14">
          <Button variant="tertiary" size="sm" onClick={onViewReplies}>
            {isRepliesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {comment.replyCount} replies
          </Button>
        </div>
      )}

      {comment.replyCount > 0 && variant === 'comment' && isRepliesOpen && (
        <CommentReplies parentId={comment.id} videoId={comment.videoId} />
      )}
    </>
  );
};
