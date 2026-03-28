'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { UploadDropzone } from '@/lib/uploadthing';
import { ResponsiveModal } from '@/components/responsive-modal';

interface Props {
  open: boolean;
  videoId: string;
  onOpenChange: (open: boolean) => void;
}

export const ThumbnailUploadModal = ({
  open,
  videoId,
  onOpenChange,
}: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const onUploadComplete = () => {
    queryClient.invalidateQueries(
      trpc.studio.getOne.queryOptions({ id: videoId }),
    );

    queryClient.invalidateQueries(
      trpc.studio.getMany.infiniteQueryOptions(
        { limit: DEFAULT_LIMIT },
        { getNextPageParam: (lastpage) => lastpage.nextCursor },
      ),
    );

    onOpenChange(false);
  };

  return (
    <ResponsiveModal
      open={open}
      title="Upload a thumbnail"
      onOpenChange={onOpenChange}
    >
      <UploadDropzone
        input={{ videoId }}
        endpoint="thumbnailUploader"
        onClientUploadComplete={onUploadComplete}
      />
    </ResponsiveModal>
  );
};
