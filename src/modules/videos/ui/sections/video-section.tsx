'use client';

import { Suspense, useRef } from 'react';

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ErrorBoundary } from 'react-error-boundary';

import { cn } from '@/lib/utils';
import { useTRPC } from '@/trpc/client';
import { VideoPlayer } from '../components/video-player';
import { VideoBanner } from '../components/video-banner';
import { VideoTopRow } from '../components/video-top-row';

interface Props {
  videoId: string;
}

export const VideoSection = ({ videoId }: Props) => {
  return (
    <Suspense fallback={<p>loading</p>}>
      <ErrorBoundary fallback={<p>error</p>}>
        <VideoSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const VideoSectionSuspense = ({ videoId }: Props) => {
  const trpc = useTRPC();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const hasTrackedViewRef = useRef(false);

  const { data: video } = useSuspenseQuery(
    trpc.videos.getOne.queryOptions({ id: videoId }),
  );

  const { mutate } = useMutation(
    trpc.videoViews.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.videos.getOne.queryOptions({ id: videoId }),
        );
      },
      // Remove ref access from here
    }),
  );

  const onPlay = () => {
    if (!isSignedIn) return;

    if (!hasTrackedViewRef.current) {
      mutate(
        { videoId },
        {
          onError: () => {
            hasTrackedViewRef.current = true;
          },
        },
      );
    }
  };

  return (
    <>
      <div
        className={cn(
          'aspect-video bg-black rounded-xl overflow-hidden relative',
          video.muxStatus !== 'ready' && 'rounded-b-none',
        )}
      >
        <VideoPlayer
          autoPlay
          onPlay={onPlay}
          playbackId={video.muxPlaybackId}
          thumbnailUrl={video.thumbnailUrl}
        />
      </div>

      <VideoBanner status={video.muxStatus} />
      <VideoTopRow video={video} />
    </>
  );
};
