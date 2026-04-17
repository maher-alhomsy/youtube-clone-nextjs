import { useAuth } from '@clerk/nextjs';
import { Edit2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { type UserGetOneOutput } from '../../types';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  user: UserGetOneOutput;
}

export const UserPageBannerSkeleton = () => {
  return <Skeleton className="w-full max-h-50 h-[15vh] md:h-[25vh]" />;
};

export const UserPageBanner = ({ user }: Props) => {
  const { userId } = useAuth();

  return (
    <div className="relative group">
      <div
        className={cn(
          'w-full max-h-50 h-[15vh] md:h-[25vh] bg-linear-to-r from-gray-100 to-gray-200 rounded-xl',
          user.bannerUrl ? 'bg-cover bg-center' : 'bg-gray-100',
        )}
        style={{
          backgroundImage: user.bannerUrl
            ? `url(${user.bannerUrl})`
            : undefined,
        }}
      >
        {user.clerkId === userId && (
          <Button
            size="icon"
            type="button"
            className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/50 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          >
            <Edit2Icon className="size-4 text-white" />
          </Button>
        )}
      </div>
    </div>
  );
};
