import Link from 'next/link';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquareIcon, MoreVerticalIcon, Trash2Icon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Comment } from '../../types';
import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/user-avatar';

interface Props {
  comment: Comment;
}

export const CommentItem = ({ comment }: Props) => {
  const trpc = useTRPC();
  const clerk = useClerk();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

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

  return (
    <div className="flex gap-4">
      <Link href={`/users/${comment.userId}`}>
        <UserAvatar
          size="lg"
          name={comment.user.name}
          imageUrl={comment.user.imageUrl}
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/users/${comment.userId}`}>
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
      </div>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild disabled={isPending}>
          <Button variant="ghost" size="icon" className="size-8 cursor-pointer">
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={isPending} onClick={() => {}}>
            <MessageSquareIcon className="size-4" />
            Reply
          </DropdownMenuItem>

          {comment.user.clerkId === userId && (
            <DropdownMenuItem disabled={isPending} onClick={onDelete}>
              <Trash2Icon className="size-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
