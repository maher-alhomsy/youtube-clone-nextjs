'use client';

import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';
import { useSuspenseQuery } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { CommentForm } from '@/modules/comments/ui/components/comment-form';
import { CommentItem } from '@/modules/comments/ui/components/comment-item';

interface Props {
  videoId: string;
}

export const CommentsSectionSuspense = ({ videoId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.comments.getMany.queryOptions({ videoId }),
  );

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-6">
        <h1>0 Comments</h1>

        <CommentForm videoId={videoId} />
      </div>

      <div className="flex flex-col gap-4 mt-2">
        {data.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
};

export const CommentsSection = ({ videoId }: Props) => {
  return (
    <Suspense>
      <ErrorBoundary fallback={<p>error</p>}>
        <CommentsSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};
