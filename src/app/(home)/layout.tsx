import { HomeLayout } from '@/modules/home/ui/layouts/home-layout';

interface Props {
  children: React.ReactNode;
}

export const dynamic = 'force-dynamic';

const Layout = ({ children }: Props) => {
  return <HomeLayout>{children}</HomeLayout>;
};

export default Layout;
