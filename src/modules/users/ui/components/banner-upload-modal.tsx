'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { UploadDropzone } from '@/lib/uploadthing';
import { ResponsiveModal } from '@/components/responsive-modal';

interface Props {
  open: boolean;
  userId: string;
  onOpenChange: (open: boolean) => void;
}

export const BannerUploadModal = ({ open, userId, onOpenChange }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const onUploadComplete = () => {
    queryClient.invalidateQueries(trpc.users.getOne.queryOptions({ userId }));

    onOpenChange(false);
  };

  return (
    <ResponsiveModal
      open={open}
      title="Upload a banner"
      onOpenChange={onOpenChange}
    >
      <UploadDropzone
        endpoint="bannerUploader"
        onClientUploadComplete={onUploadComplete}
      />
    </ResponsiveModal>
  );
};
