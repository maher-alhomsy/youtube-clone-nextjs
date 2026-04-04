import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Props {
  size?: string;
  disabled: boolean;
  className?: string;
  onClick: () => void;
  isSubscribed: boolean;
}

export const SubscriptionButton = ({
  size,
  onClick,
  disabled,
  className,
  isSubscribed,
}: Props) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size={size as 'lg'}
      variant={isSubscribed ? 'secondary' : 'default'}
      className={cn('rounded-full cursor-pointer', className)}
    >
      {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
    </Button>
  );
};
