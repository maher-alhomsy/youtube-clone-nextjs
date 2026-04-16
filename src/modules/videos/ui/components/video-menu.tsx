import { useState } from 'react';

import {
  ShareIcon,
  Trash2Icon,
  ListPlusIcon,
  MoreVerticalIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { APP_URL } from '@/constants';
import { Button } from '@/components/ui/button';
import { PlaylistAddModal } from '@/modules/playlists/ui/components/playlist-add-modal';

interface Props {
  videoId: string;
  onRemove?: () => void;
  variant?: 'ghost' | 'secondary';
}

export const VideoMenu = ({ videoId, onRemove, variant = 'ghost' }: Props) => {
  const [openPlaylistAddModal, setOpenPlaylistAddModal] = useState(false);

  const onShare = () => {
    const fullUrl = `${APP_URL}/videos/${videoId}`;
    navigator.clipboard.writeText(fullUrl);

    toast.success('Link copied to the clipboard');
  };

  return (
    <>
      <PlaylistAddModal
        videoId={videoId}
        open={openPlaylistAddModal}
        onOpenChange={setOpenPlaylistAddModal}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant={variant}
            className="rounded-full cursor-pointer"
          >
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-40"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem onClick={onShare}>
            <ShareIcon className="mr-2 size-4" />
            Share
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setOpenPlaylistAddModal(true)}>
            <ListPlusIcon className="mr-2 size-4" />
            Add to playlist
          </DropdownMenuItem>

          {onRemove && (
            <DropdownMenuItem onClick={onRemove}>
              <Trash2Icon className="mr-2 size-4" />
              Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
