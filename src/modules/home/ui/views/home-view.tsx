import { CategoriesSection } from '../sections/categories-section';

interface Props {
  categoryId?: string;
}

const HomeView = ({ categoryId }: Props) => {
  return (
    <div className="max-w-600 mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
      <CategoriesSection categoryId={categoryId} />
    </div>
  );
};

export default HomeView;
