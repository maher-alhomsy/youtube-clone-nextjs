import { StudioLayout } from '@/modules/studio/ui/layouts/studio-layout';

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return <StudioLayout>{children}</StudioLayout>;
};

export default Layout;
