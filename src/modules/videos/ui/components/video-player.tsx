'use client';

import MuxPlayer from '@mux/mux-player-react';

import { THUMBNAIL_FALLBACK } from '../../constants';

interface Props {
  autoPlay?: boolean;
  onPlay?: () => void;
  playbackId?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
}

export const VideoPlayerSkeleton = () => {
  return <div className="rounded-xl aspect-video bg-black" />;
};

export const VideoPlayer = ({
  onPlay,
  autoPlay,
  playbackId,
  thumbnailUrl,
}: Props) => {
  // if (!playbackId) return;

  return (
    <MuxPlayer
      onPlay={onPlay}
      thumbnailTime={0}
      playerInitTime={0}
      autoPlay={autoPlay}
      accentColor="#FF2056"
      playbackId={playbackId || ''}
      className="size-full object-contain"
      poster={thumbnailUrl || THUMBNAIL_FALLBACK}
    />
  );
};
