import { VideoSection } from '../sections/video-section';
import { CommentsSection } from '../sections/comments-section';
import { SuggestionsSection } from '../sections/suggestions-section';

interface Props {
  videoId: string;
}

const VideoView = ({ videoId }: Props) => {
  return (
    <div className="flex flex-col max-w-425 mx-auto pt-2.5 px-4 mb-10">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <VideoSection videoId={videoId} />

          <div className="xl:hidden block mt-4">
            <SuggestionsSection />
          </div>

          <CommentsSection />
        </div>

        <div className="xl:block hidden w-full xl:w-95 2xl:w-115 shrink">
          <SuggestionsSection />
        </div>
      </div>
    </div>
  );
};

export default VideoView;
