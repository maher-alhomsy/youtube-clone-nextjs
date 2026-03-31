'use client';

import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';
import { useSuspenseQuery } from '@tanstack/react-query';

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

  const { data: video } = useSuspenseQuery(
    trpc.videos.getOne.queryOptions({ id: videoId }),
  );

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
          onPlay={() => {}}
          playbackId={video.muxPlaybackId}
          thumbnailUrl={video.thumbnailUrl}
        />
      </div>

      <VideoBanner status={video.muxStatus} />
      <VideoTopRow video={video} />
    </>
  );
};
