import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Avatar, AvatarImage } from './ui/avatar';

const avatarVariant = cva('', {
  variants: {
    size: {
      default: 'size-9',
      xs: 'size-4',
      sm: 'size-6',
      lg: 'size-10',
      xl: 'size-[160px]',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

interface Props extends VariantProps<typeof avatarVariant> {
  imageUrl: string;
  name: string;
  className?: string;
  onClick?: () => void;
}

const UserAvatar = ({ imageUrl, name, className, onClick, size }: Props) => {
  return (
    <Avatar
      onClick={onClick}
      className={cn(avatarVariant({ size, className }))}
    >
      <AvatarImage src={imageUrl} alt={name} />
    </Avatar>
  );
};

export default UserAvatar;
