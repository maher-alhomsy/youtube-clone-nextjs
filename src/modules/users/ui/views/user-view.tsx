import { UserSection } from '../sections/user-section';
import { VideosSection } from '../sections/videos-section';

interface Props {
  userId: string;
}

export const UserView = ({ userId }: Props) => {
  return (
    <div className="flex flex-col max-w-325 px-4 pt-2.5 mx-auto mb-10 gap-y-6">
      <UserSection userId={userId} />

      <VideosSection userId={userId} />
    </div>
  );
};
