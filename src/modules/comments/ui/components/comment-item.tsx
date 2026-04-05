import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { Comment } from '../../types';
import UserAvatar from '@/components/user-avatar';

interface Props {
  comment: Comment;
}

export const CommentItem = ({ comment }: Props) => {
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
    </div>
  );
};
