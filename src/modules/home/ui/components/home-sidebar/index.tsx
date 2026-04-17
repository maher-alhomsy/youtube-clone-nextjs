import { Show } from '@clerk/nextjs';

import { MainSection } from './main-section';
import { PersonalSection } from './personal-section';
import { Separator } from '@/components/ui/separator';
import { SubscriptionsSection } from './subscriptions-section';
import { Sidebar, SidebarContent } from '@/components/ui/sidebar';

export const HomeSidebar = () => {
  return (
    <Sidebar className="pt-16 z-40 border-none" collapsible="icon">
      <SidebarContent className="bg-background">
        <MainSection />
        <Separator />

        <PersonalSection />

        <Show when="signed-in">
          <Separator />

          <SubscriptionsSection />
        </Show>
      </SidebarContent>
    </Sidebar>
  );
};
