import UserAvatar from '@/components/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionButton } from './subscription-button';

interface Props {
  name: string;
  imageUrl: string;
  disabled: boolean;
  subscriberCount: number;
  onUnsubscribe: () => void;
}

export const SubscriptionItemSkeleton = () => {
  return (
    <div className="flex items-start gap-4">
      <Skeleton className="size-10 rounded-full" />

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="w-24 h-4 mb-1" />
            <Skeleton className="w-20 h-3" />
          </div>

          <Skeleton className="w-20 h-8" />
        </div>
      </div>
    </div>
  );
};

export const SubscriptionItem = ({
  name,
  imageUrl,
  disabled,
  onUnsubscribe,
  subscriberCount,
}: Props) => {
  return (
    <div className="flex items-start gap-4">
      <UserAvatar imageUrl={imageUrl} name={name} size="lg" />

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm">{name.replace('null', '')}</h3>
            <p className="text-xs text-muted-foreground">
              {subscriberCount.toLocaleString()} subscribers
            </p>
          </div>

          <SubscriptionButton
            size="sm"
            isSubscribed
            disabled={disabled}
            onClick={(e) => {
              e?.preventDefault();
              onUnsubscribe();
            }}
          />
        </div>
      </div>
    </div>
  );
};
