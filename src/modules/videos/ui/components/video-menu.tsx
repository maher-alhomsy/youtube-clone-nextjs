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
import { Button } from '@/components/ui/button';

interface Props {
  videoId: string;
  onRemove?: () => void;
  variant?: 'ghost' | 'secondary';
}

export const VideoMenu = ({ videoId, onRemove, variant = 'ghost' }: Props) => {
  const onShare = () => {
    const fullUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/videos/${videoId}`;
    navigator.clipboard.writeText(fullUrl);

    toast.success('Link copied to the clipboard');
  };

  return (
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

        <DropdownMenuItem onClick={() => {}}>
          <ListPlusIcon className="mr-2 size-4" />
          Add to playlist
        </DropdownMenuItem>

        {onRemove && (
          <DropdownMenuItem onClick={() => {}}>
            <Trash2Icon className="mr-2 size-4" />
            Remove
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
